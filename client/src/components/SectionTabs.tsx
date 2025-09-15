import React, { useState } from "react";
import { Tabs, TabsHeader, Tab, TabsProps } from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";

export interface TabItemConfig {
  label: string;
  value: string;
  content: React.ReactNode;
}

interface Props extends Omit<TabsProps, "value" | "onChange"> {
  data: TabItemConfig[];
  initial?: string;
}

export const SectionTabs: React.FC<Props> = ({
  data,
  initial,
  ...otherProps
}) => {
  const initialValue = initial || (data[0]?.value ?? "");
  const [activeTab, setActiveTab] = useState<string>(initialValue);

  return (
    <Tabs {...otherProps} value={activeTab}>
      <TabsHeader
        className="rounded-none border-b border-gray-300 bg-transparent p-0"
        indicatorProps={{
          className:
            "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none",
        }}
      >
        {data.map(({ label, value }) => (
          <Tab
            key={value}
            value={value}
            onClick={() => setActiveTab(value)}
            className={twMerge(
              "w-auto mr-6 py-2 px-0 hover:text-gray-900",
              activeTab === value ? "text-black font-semibold" : "text-gray-700"
            )}
          >
            {label}
          </Tab>
        ))}
      </TabsHeader>
      <div className="px-0 py-4">
        {data.find((it) => it.value === activeTab)?.content}
      </div>
    </Tabs>
  );
};
