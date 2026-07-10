import { cn } from "~/lib/utils";

const ChatHeaderContainer = ({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "h-10 flex w-full justify-between items-center px-2 ",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ChatHeaderContainer;
