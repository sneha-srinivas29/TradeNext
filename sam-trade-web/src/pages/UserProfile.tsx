import { useState } from "react";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { User, Pencil } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState("Sneha Srinivas");
  const [location] = useState("Hyderabad");
  const [loginId] = useState("sneha@email.com");
  const [phoneNumber] = useState("9876543210");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleSave = () => {
    setIsEditing(false);

    toast({
      title: "Profile Updated",
      description: "Your profile details have been saved successfully.",
    });
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  return (
    <DashboardLayout userName="Sneha">
      <div className="max-w-lg mx-auto mt-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          {/* PROFILE IMAGE */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center mb-2 overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>

            {isEditing && (
              <>
                <label
                  htmlFor="profile-upload"
                  className="text-primary text-sm hover:underline cursor-pointer"
                >
                  Change Profile Picture
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </>
            )}

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-0 right-0 flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>

          {/* FORM */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                className={`input-field ${
                  !isEditing ? "bg-muted cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                disabled
                className="input-field bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Login ID
              </label>
              <input
                type="text"
                value={loginId}
                disabled
                className="input-field bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                disabled
                className="input-field bg-muted cursor-not-allowed"
              />
            </div>

            {isEditing ? (
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="btn-primary flex-1">
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button className="w-full text-primary hover:underline text-sm mt-6">
                Change Password
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
