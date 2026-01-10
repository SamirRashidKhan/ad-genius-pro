-- Fix MISSING_RLS: Add deny policies to prevent direct token manipulation
-- Users should only be able to view their token balance, not modify it

-- Deny user insert on user_tokens
CREATE POLICY "Deny user insert on tokens"
ON public.user_tokens
FOR INSERT
WITH CHECK (false);

-- Deny user update on user_tokens  
CREATE POLICY "Deny user update on tokens"
ON public.user_tokens
FOR UPDATE
USING (false);

-- Deny user delete on user_tokens
CREATE POLICY "Deny user delete on tokens"
ON public.user_tokens
FOR DELETE
USING (false);

-- Fix CLIENT_SIDE_AUTH: Create secure RPC for ad creation with atomic token deduction
-- This function validates token balance server-side and performs atomic operations
CREATE OR REPLACE FUNCTION create_ad_with_tokens(
  _business_id UUID,
  _title TEXT,
  _ad_type TEXT,
  _duration_seconds INTEGER,
  _platforms TEXT[],
  _tokens_needed INTEGER
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _ad_id UUID;
  _current_balance INTEGER;
  _user_id UUID;
BEGIN
  -- Get the authenticated user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate inputs
  IF _tokens_needed <= 0 THEN
    RAISE EXCEPTION 'Invalid token amount';
  END IF;
  
  IF _title IS NULL OR length(trim(_title)) = 0 THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  
  -- Check the business belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = _business_id 
    AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'Business not found or access denied';
  END IF;
  
  -- Get current token balance
  SELECT balance INTO _current_balance
  FROM user_tokens
  WHERE user_id = _user_id;
  
  IF _current_balance IS NULL THEN
    RAISE EXCEPTION 'Token balance not found';
  END IF;
  
  IF _current_balance < _tokens_needed THEN
    RAISE EXCEPTION 'Insufficient tokens. Required: %, Available: %', _tokens_needed, _current_balance;
  END IF;
  
  -- Atomically deduct tokens (with balance check in WHERE clause for race condition protection)
  UPDATE user_tokens
  SET balance = balance - _tokens_needed
  WHERE user_id = _user_id
  AND balance >= _tokens_needed;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token deduction failed - insufficient balance';
  END IF;
  
  -- Create advertisement
  INSERT INTO advertisements (
    user_id,
    business_id,
    title,
    ad_type,
    duration_seconds,
    platforms,
    status,
    tokens_spent
  ) VALUES (
    _user_id,
    _business_id,
    _title,
    _ad_type,
    _duration_seconds,
    _platforms,
    'processing',
    _tokens_needed
  ) RETURNING id INTO _ad_id;
  
  RETURN _ad_id;
END;
$$;