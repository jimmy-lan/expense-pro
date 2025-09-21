import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Typography, Spinner } from "@material-tailwind/react";
import { AppNavbar } from "../../components";
import { Button } from "../../components/ui/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { spacesApi } from "../../lib/api";
import { Activity } from "./Activity";

export const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const id = Number(spaceId);

  const spaceQuery = useQuery({
    queryKey: ["space", id],
    queryFn: () => spacesApi.show(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const space = spaceQuery.data?.space;

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />

      <div className="mx-auto px-4 py-6 md:px-8 lg:px-12 2xl:px-16">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1">
              <Button
                color="gray"
                variant="text"
                size="sm"
                onClick={() => navigate("/my")}
                className="!px-0 mb-4"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to My Spaces
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {spaceQuery.isLoading ? (
                <>
                  <Spinner color="blue" className="h-8 w-8" />
                  <Typography
                    variant="h3"
                    as="h1"
                    className="font-bold text-gray-900"
                  >
                    Loading...
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="h3"
                  as="h1"
                  className="font-bold text-gray-900"
                >
                  {space?.name || "Space"}
                </Typography>
              )}
            </div>
            {spaceQuery.isError && (
              <Typography variant="small" className="text-red-700 mt-1">
                Failed to load space details
              </Typography>
            )}
            {space?.description && (
              <Typography variant="small" className="text-gray-600 mt-1">
                {space.description || ""}
              </Typography>
            )}
          </div>
          <div className="mt-2 md:mt-0">
            <Button
              variant="outlined"
              onClick={() => navigate(`/my/space/${id}/transactions/new`)}
              fullWidth
              size="md"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
        <Activity spaceId={id} space={space} />
      </div>
    </div>
  );
};
