import * as React from "react";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { cn } from "~/lib/utils";

const Container = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-1 min-h-0 flex-col w-full h-screen overflow-auto overscroll-none scrollbar-thin scrollbar-gutter-both [overflow-anchor:none]",
          className,
        )}
        {...props}
      >
        <div className="flex flex-col grow shrink-0 w-full">{children}</div>
      </div>
    );
  },
);
Container.displayName = "Container";

const ContainerHeader = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div className={cn("shrink-0 bg-card/50 ", className)} {...props}>
      <div className="max-w-3xl mx-auto size-full px-4">{children}</div>
    </div>
  );
};

const ContainerSticky = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const [ref, entry] = useIntersectionObserver({
    threshold: [1],
    rootMargin: "-1px 0px 0px 0px",
  });
  const stuck = (entry?.intersectionRatio ?? 1) < 1;

  return (
    <div
      ref={ref}
      data-stuck={stuck || undefined}
      className={cn(
        "sticky bg-background top-0 z-10 h-16",
        stuck && "border-b border-border",
        className,
      )}
      {...props}
    >
      <div className="max-w-3xl mx-auto w-full h-full flex items-center px-4">
        {children}
      </div>
    </div>
  );
};

const ContainerBody = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn("flex-1 min-h-0 max-w-3xl mx-auto w-full px-4", className)}
      {...props}
    />
  );
};

export { Container, ContainerHeader, ContainerSticky, ContainerBody };
