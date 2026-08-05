import * as React from "react";
import { cn } from "~/lib/utils";

const Container = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "flex flex-1 min-h-0 flex-col w-full h-screen overflow-auto scrollbar-thin",
        className,
      )}
    >
      <div className="flex flex-col grow shrink-0 max-w-3xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
};

const ContainerHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn("shrink-0  bg-card/50 backdrop-blur-sm", className)}
      {...props}
    />
  );
};

const ContainerSticky = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn("sticky bg-background top-0 z-10 h-16", className)}
      {...props}
    />
  );
};

const ContainerBody = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return <div className={cn("flex-1 min-h-0 ", className)} {...props} />;
};

export { Container, ContainerHeader, ContainerSticky, ContainerBody };
