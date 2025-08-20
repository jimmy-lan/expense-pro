import React from "react";
import { useSearchParams } from "react-router-dom";
import { AppNavbar } from "../../components";
import { SpacesMenuList } from "./SpacesMenuList";
import { StandardSpacesList } from "./StandardSpacesList";
import { RecentlyDeletedSpacesList } from "./RecentlyDeletedSpacesList";
import { MenuKey } from "./menu";

const MySpacesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = (searchParams.get("tab") ?? "all") as MenuKey;

  const handleSelect = (value: MenuKey) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("tab");
    else params.set("tab", value);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />

      <div className="mx-auto grid grid-cols-1 gap-12 2xl:gap-16 px-4 py-6 lg:grid-cols-12 lg:px-12 2xl:px-16">
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <div className="sticky top-24 mt-2">
            <SpacesMenuList selected={selectedParam} onSelect={handleSelect} />
          </div>
        </aside>

        <main className="lg:col-span-8 xl:col-span-9">
          {selectedParam === "deleted" ? (
            <RecentlyDeletedSpacesList
              selected={selectedParam}
              onSelect={handleSelect}
            />
          ) : (
            <StandardSpacesList
              filter={selectedParam as any}
              selected={selectedParam}
              onSelect={handleSelect}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export { MySpacesPage };
