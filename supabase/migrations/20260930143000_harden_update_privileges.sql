-- Harden Message Update Privileges
CREATE OR REPLACE FUNCTION public.check_message_update_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If the user is the original sender, they are allowed to update their own message content.
    -- However, they still shouldn't be able to change immutable fields like sender_id or conversation_id.
    -- (auth.uid() might be null for service_role, so bypass checks if service_role)
    IF auth.role() = 'authenticated' THEN
        IF auth.uid() = OLD.sender_id THEN
            IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
                RAISE EXCEPTION 'Cannot change message sender_id';
            END IF;
            IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
                RAISE EXCEPTION 'Cannot change message conversation_id';
            END IF;
            IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
                RAISE EXCEPTION 'Cannot change message created_at';
            END IF;
            -- Allow other changes (content, is_edited, status, etc.)
            RETURN NEW;
        END IF;

        -- If the user is NOT the sender, they can ONLY update the `status` column (to 'delivered' or 'read').
        -- We verify that NO other column is being changed.
        IF NEW.id IS DISTINCT FROM OLD.id OR
           NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR
           NEW.sender_id IS DISTINCT FROM OLD.sender_id OR
           NEW.content IS DISTINCT FROM OLD.content OR
           NEW.type IS DISTINCT FROM OLD.type OR
           NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id OR
           NEW.forwarded_from_id IS DISTINCT FROM OLD.forwarded_from_id OR
           NEW.is_edited IS DISTINCT FROM OLD.is_edited OR
           NEW.is_deleted IS DISTINCT FROM OLD.is_deleted OR
           NEW.deleted_at IS DISTINCT FROM OLD.deleted_at OR
           NEW.created_at IS DISTINCT FROM OLD.created_at
        THEN
            RAISE EXCEPTION 'Not authorized to modify message content or metadata. You may only update status.';
        END IF;

        -- Prevent reverting read status
        IF OLD.status = 'read' AND NEW.status != 'read' THEN
            NEW.status = 'read';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_message_update ON public.messages;
CREATE TRIGGER tr_check_message_update
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.check_message_update_privileges();

-- Harden Conversation Member Update Privileges
CREATE OR REPLACE FUNCTION public.check_member_update_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow role changes if they are already an owner, or block entirely via direct UPDATE unless service_role.
    -- Assuming role promotion should be done via a dedicated secure RPC, we block it here.
    IF auth.role() = 'authenticated' THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Cannot escalate or change role directly.';
        END IF;
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Cannot change user_id of membership';
        END IF;
        IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
            RAISE EXCEPTION 'Cannot change conversation_id of membership';
        END IF;
        IF NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
            RAISE EXCEPTION 'Cannot change joined_at timestamp';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_member_update ON public.conversation_members;
CREATE TRIGGER tr_check_member_update
BEFORE UPDATE ON public.conversation_members
FOR EACH ROW
EXECUTE FUNCTION public.check_member_update_privileges();
