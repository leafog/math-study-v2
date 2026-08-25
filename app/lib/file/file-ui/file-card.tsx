import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Download,
  Eye,
  FileIcon,
  MoreHorizontal,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AttachmentRow } from "~/routes/_app.library";
import { fileIcons, getFileType } from "~/lib/file";
import MathResBlock from "~/components/math/math-res-block";
import useAttachmentActions from "~/hooks/use-attachment-actions";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { Checkbox } from "~/components/ui/checkbox";
import { useBoolean } from "usehooks-ts";
import { useState } from "react";

/**
 * 共用的文件卡片：Card 的 props（className/style/size 等）透传出去，
 * children 渲染进 CardContent；标题与操作菜单（下载/重命名/删除）为卡片外壳。
 */
export interface FileCardProps extends React.ComponentProps<typeof Card> {
  row: AttachmentRow;
  children?: React.ReactNode;

  selected?: boolean;

  /** 标题显示：true 常显；false 隐藏；undefined(默认) hover 时显示 */
  showTitle?: boolean;

  /** 上下 hover 渐变遮罩：默认 true（图片卡需要垫底）；文字卡可传 false 并自加 hover 背景 */
  showScrim?: boolean;

  onSelectedChange?: (id: string, checked: boolean) => void;
}

const FileCard = ({
  row,
  children,
  className,
  selected,
  showTitle = false,
  showScrim = true,
  onSelectedChange,
  ...cardProps
}: FileCardProps) => {
  const { t } = useTranslation();
  const { download, remove, rename } = useAttachmentActions(row);

  // 按文件类别取统一图标，无法归类回退通用文件图标
  const fileType = getFileType(row?.media_type ?? "");
  const Icon = fileType ? (fileIcons[fileType] ?? FileIcon) : FileIcon;

  const [newName, setNewName] = useState(
    row?.meta_data?.origin_filename ?? row?.filename ?? "",
  );
  const { value: open, setFalse, setValue } = useBoolean(false);
  const { value: resultOpen, setValue: setResultOpen } = useBoolean(false);

  return (
    <Card
      {...cardProps}
      className={cn(
        "group/card relative overflow-hidden mx-auto w-full max-w-sm h-64 bg-center bg-no-repeat bg-contain",
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        className,
      )}
    >
      {/* hover 时上下加渐变，突出标题/操作；不挡点击。子组件用 showScrim 控制是否显示 */}
      {showScrim && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-black/25 to-transparent opacity-0 transition-opacity group-hover/card:opacity-100" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/25 to-transparent opacity-0 transition-opacity group-hover/card:opacity-100" />
        </>
      )}

      <CardHeader className="relative z-10">
        <CardTitle
          className={cn(
            "flex min-w-0 items-center gap-1.5  text-accent",
            showTitle === true
              ? "opacity-100 text-current"
              : "opacity-0 group-hover/card:opacity-100 focus-within:opacity-100",
          )}
        >
          <Icon className="shrink-0" />
          <span className="truncate">
            {row?.meta_data?.origin_filename ?? row?.filename}
          </span>
        </CardTitle>
        <CardAction className="opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="bg-background"
                size="icon-sm"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={download}>
                  <Download />
                  {t("attachment.download")}
                </DropdownMenuItem>
                <Dialog open={resultOpen} onOpenChange={setResultOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Eye />
                      {t("attachment.viewResult")}
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl md:min-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("attachment.viewResult")}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
                      <MathResBlock>
                        {row?.meta_data?.last_task_text ?? ""}
                      </MathResBlock>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={open} onOpenChange={setValue}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <PencilLine />
                      {t("attachment.rename")}
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("attachment.rename")}</DialogTitle>
                    </DialogHeader>
                    <Input
                      autoFocus
                      defaultValue={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          rename(newName);
                          setFalse();
                        }
                      }}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          onClick={() => {
                            rename(newName);
                            setFalse();
                          }}
                        >
                          {t("common.confirm")}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <DropdownMenuItem onClick={remove}>
                  <Trash2 />
                  {t("attachment.delete")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent
        className="overflow-hidden h-full"
        onClick={() => onSelectedChange?.(row.id, !selected)}
      >
        {children}
        <Checkbox
          className={cn(
            "rounded-full bg-background absolute right-5 bottom-5 size-6 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100",
            selected ? "opacity-100" : "opacity-0",
          )}
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(checked) =>
            onSelectedChange?.(row.id, checked === true)
          }
        />
      </CardContent>
    </Card>
  );
};

export default FileCard;
