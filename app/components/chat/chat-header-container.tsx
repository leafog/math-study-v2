const ChatHeaderContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-10 bg-red-100 flex w-full justify-between items-center px-2">
      {children}
    </div>
  );
};

export default ChatHeaderContainer;
