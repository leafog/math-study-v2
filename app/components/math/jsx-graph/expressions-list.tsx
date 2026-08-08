import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { useBoolean } from "usehooks-ts";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import MathInput, { MathInputReadOnly } from "../math-live/math-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { useCounter } from "@uidotdev/usehooks";
import { Input } from "~/components/ui/input";
import { Field } from "~/components/ui/field";

const ExpressionItem = () => {
  return <div></div>;
};
const SliderItem = () => {
  return (
    <div className="flex flex-col gap-1 w-full p-1">
      <div className="flex flex-row items-center gap-2">
        <MathInputReadOnly latex={"a=1"} />
        <Field orientation="horizontal">
          <Input value="1"></Input>
          <MathInputReadOnly latex={String.raw`\le a \le`} />
          <Input value="1"></Input>
          步长
          <Input value="1"></Input>
        </Field>
      </div>
      <div className="flex flex-row items-center gap-1">
        10 <Slider defaultValue={[1]} min={10} max={100} step={10} />
        10
      </div>
    </div>
  );
};
const ExpressionsList = () => {
  const {
    value: open,
    setTrue: openPanel,
    setFalse: closePanel,
  } = useBoolean(false);
  const [num, { increment }] = useCounter(3);
  return (
    <div className="p-2">
      <Button
        size="icon"
        variant="ghost"
        className={open ? "hidden" : "block"}
        onClick={openPanel}
      >
        <ChevronsLeftIcon />
      </Button>
      <div className={open ? "w-72 max-h-[60vh] flex flex-col" : "hidden"}>
        <Card className="flex-1 min-h-0 flex flex-col overflow-hidden [--card-spacing:--spacing(2)]">
          <CardHeader className="shrink-0">
            <Button size="icon" variant={"ghost"} onClick={closePanel}>
              <ChevronsRightIcon />
            </Button>
            <Button
              onClick={(e) => {
                increment();
              }}
            >
              {num}
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 min-h-0 overflow-auto scrollbar-thin">
            <Accordion type="multiple">
              <AccordionItem key="expressions" value={"expressions"}>
                <AccordionTrigger>expressions</AccordionTrigger>
                <AccordionContent>
                  <div className=" w-full ">
                    <MathInput latex={"e=x^2"} />
                    <MathInput latex={"e=x^2"} />
                    <MathInput latex={"e=x^2"} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem key={`sliderItem-${num}`} value={"sliders"}>
                <AccordionTrigger>Slider</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-4 divide-y-2  divide-border">
                    {new Array(num).fill(null).map((_, i) => (
                      <SliderItem key={i}></SliderItem>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem key="sidler" value={"sidler"}>
                <AccordionTrigger>expressions</AccordionTrigger>
                <AccordionContent>
                  <div className=" w-full bg-red-50">
                    <MathInput latex={"e=x^2"} />
                    <MathInput latex={"e=x^2"} />
                    <MathInput latex={"e=x^2"} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpressionsList;
