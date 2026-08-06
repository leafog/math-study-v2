import { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Check,
  SettingsIcon,
  Settings2Icon,
  CodeIcon,
  Car,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Command } from "~/components/ui/command";
import {
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "~/components/ai-elements/model-selector";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type SettingsDialogProps = Readonly<{
  children: React.ReactNode;
}>;

const THEME_OPTIONS = [
  { value: "light" as const, icon: Sun, label: "settings.light" },
  { value: "dark" as const, icon: Moon, label: "settings.dark" },
  { value: "system" as const, icon: Monitor, label: "settings.system" },
];

const LANGUAGE_OPTIONS = [
  { value: "zh" as const, label: "中文" },
  { value: "en" as const, label: "English" },
];

const MODELS = [
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek" as const,
  },
];

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-v4-flash");
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 min-w-0">
          <Tabs
            orientation="vertical"
            defaultValue="general"
            className="flex h-120"
          >
            <TabsList className="w-32">
              <TabsTrigger value="general" className="w-full justify-start">
                <Settings2Icon /> {t("settings.general")}
              </TabsTrigger>
              <TabsTrigger value="model" className="w-full justify-start">
                <CodeIcon /> {t("settings.model")}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="general"
              className="px-6 py-4 space-y-4 overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.theme")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                      <Button
                        key={value}
                        variant={theme === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme(value)}
                      >
                        <Icon className="size-4" />
                        {t(label)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.language")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {LANGUAGE_OPTIONS.map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={
                          i18n.language === value ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => i18n.changeLanguage(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="model" className="flex-1 p-0 overflow-hidden">
              <Command className="h-full rounded-none border-none">
                <ModelSelectorInput placeholder={t("settings.selectModel")} />
                <ModelSelectorList>
                  <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                  <ModelSelectorGroup heading="DeepSeek">
                    {MODELS.map((model) => (
                      <ModelSelectorItem
                        key={model.id}
                        onSelect={() => setSelectedModel(model.id)}
                        className={
                          selectedModel === model.id ? "bg-accent" : ""
                        }
                      >
                        <ModelSelectorLogo provider={model.provider} />
                        <ModelSelectorName>{model.name}</ModelSelectorName>
                        {selectedModel === model.id && (
                          <Check className="ml-auto size-4" />
                        )}
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                </ModelSelectorList>
              </Command>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
