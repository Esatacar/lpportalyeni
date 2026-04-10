-- Create trigger to call notify_user_approval function
CREATE TRIGGER trigger_notify_user_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_approval();