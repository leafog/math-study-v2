import { Sun, Moon, Monitor, Settings2Icon, CodeIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemActions,
  ItemGroup,
} from "~/components/ui/item";
import {
  Container,
  ContainerHeader,
  ContainerSticky,
  ContainerBody,
} from "~/components/layout/Container";
import ModelConfig from "~/components/settings/model-config";
import ModelConfigPage from "~/components/settings/model-config-page";

const THEME_OPTIONS = [
  { value: "light" as const, icon: Sun, label: "settings.light" },
  { value: "dark" as const, icon: Moon, label: "settings.dark" },
  { value: "system" as const, icon: Monitor, label: "settings.system" },
];

const LANGUAGE_OPTIONS = [
  { value: "zh" as const, label: "中文" },
  { value: "en" as const, label: "English" },
];

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "general";

  return (
    <Container>
      <ContainerHeader className="h-20 mt-10">
        <div className="flex h-full justify-between items-center">
          <div>
            <h1 className="text-3xl font-mono">{t("settings.title")}</h1>
          </div>
        </div>
      </ContainerHeader>
      <ContainerSticky>
        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList>
            <TabsTrigger value="general">
              <Settings2Icon aria-hidden="true" /> {t("settings.general")}
            </TabsTrigger>
            <TabsTrigger value="model">
              <CodeIcon aria-hidden="true" /> {t("settings.model")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </ContainerSticky>
      <ContainerBody>
        {tab === "general" ? (
          <ItemGroup>
            <Item variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>{t("settings.theme")}</ItemTitle>
              </ItemContent>
              <ItemActions>
                {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={theme === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(label)}
                  </Button>
                ))}
              </ItemActions>
            </Item>

            <Item variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>{t("settings.language")}</ItemTitle>
              </ItemContent>
              <ItemActions>
                {LANGUAGE_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={i18n.language === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => i18n.changeLanguage(value)}
                  >
                    {label}
                  </Button>
                ))}
              </ItemActions>
            </Item>
          </ItemGroup>
        ) : (
          <div className="py-2">
            <ModelConfigPage />
          </div>
        )}
      </ContainerBody>
    </Container>
  );
};

export default Settings;
