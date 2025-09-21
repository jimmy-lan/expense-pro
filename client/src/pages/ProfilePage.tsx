import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Typography,
  Alert,
  Spinner,
} from "@material-tailwind/react";
import { AppNavbar } from "../components";
import { useUserInfo } from "../hooks";
import { authApi } from "../lib/api";

const ProfilePage: React.FC = () => {
  const { user } = useUserInfo();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  const firstName = (user as any)?.firstName || "";
  const lastName = (user as any)?.lastName || "";
  const email = (user as any)?.email || "";
  const avatarUrl = (user as any)?.avatarUrl as string | undefined;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await authApi.updateAvatar(formData);
      
      // Update user in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));
      
      setSuccess("Profile picture updated successfully!");
      
      // Trigger storage event to update other tabs
      window.dispatchEvent(new StorageEvent("storage", {
        key: "user",
        newValue: JSON.stringify(response.user),
      }));
    } catch (err: any) {
      setError(err.message || "Failed to update profile picture.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authApi.removeAvatar();
      
      // Update user in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));
      
      setSuccess("Profile picture removed successfully!");
      
      // Trigger storage event to update other tabs
      window.dispatchEvent(new StorageEvent("storage", {
        key: "user",
        newValue: JSON.stringify(response.user),
      }));
    } catch (err: any) {
      setError(err.message || "Failed to remove profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />
      
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h4" color="blue-gray">
              Profile Settings
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
              Manage your profile information and avatar
            </Typography>
          </CardHeader>
          
          <CardBody className="px-0">
            <div className="flex flex-col items-center space-y-6">
              {/* Current Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar
                  src={avatarUrl}
                  alt="Profile picture"
                  size="xxl"
                  className="border-4 border-white shadow-lg"
                />
                
                <div className="text-center">
                  <Typography variant="h5" className="font-semibold text-gray-900">
                    {`${firstName} ${lastName}`.trim() || "User"}
                  </Typography>
                  <Typography color="gray" className="text-sm">
                    {email}
                  </Typography>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert color="red" className="w-full max-w-md">
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert color="green" className="w-full max-w-md">
                  {success}
                </Alert>
              )}

              {/* Upload Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="flex-1"
                  color="blue"
                >
                  {uploading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    "Upload New Photo"
                  )}
                </Button>
                
                {avatarUrl && (
                  <Button
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    variant="outlined"
                    color="red"
                    className="flex-1"
                  >
                    {uploading ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      "Remove Photo"
                    )}
                  </Button>
                )}
              </div>

              {/* Upload Guidelines */}
              <div className="text-center text-sm text-gray-600 max-w-md">
                <Typography variant="small" color="gray">
                  Supported formats: JPG, PNG, GIF, WebP
                  <br />
                  Maximum size: 5MB
                  <br />
                  Recommended: Square image, at least 200x200 pixels
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export { ProfilePage };
