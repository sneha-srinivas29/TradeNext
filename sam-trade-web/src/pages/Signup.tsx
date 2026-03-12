import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Common/Header";
import Pulses from "../assets/Pulses.jpg";
import Agritrading from "../assets/Agritrading.jpg";
import paddy from "../assets/paddy.jpg";
import logistics from "../assets/logistics.jpg";

interface CircleProps {
  img: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
}

const Circle: React.FC<CircleProps> = ({ img }) => (
  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
    <img src={img} alt="illustration" className="h-full w-full object-cover" />
  </div>
);

const Signup = () => {
  const navigate = useNavigate();

  // Entity Details
  const [entityType, setEntityType] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [entityName, setEntityName] = useState("");
  const [email, setEmail] = useState("");

  // Contact Person Details
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [location, setLocation] = useState("");

  // Role
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [companyId, setCompanyId] = useState("");

  // Password
  const [password, setPassword] = useState("");

  // Loading state
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState("");

  // Load roles from backend on component mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch("http://localhost:3000/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        console.error("Failed to load roles");
      }
    } catch (err) {
      console.error("Error loading roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !entityType ||
      !panNumber ||
      !entityName ||
      !email ||
      !contactName ||
      !contactPhone ||
      !designation ||
      !location ||
      !roleId ||
      !companyId ||
      !password
    ) {
      alert("Please fill all fields");
      return;
    }

    if (panNumber.length !== 10) {
      alert("PAN number must be 10 characters");
      return;
    }

    if (contactPhone.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    // API call
    setLoading(true);

    try {
      const authUtils = await import("@/components/utils/authUtils");
      const payload = {
        email: email,
        name: contactName,
        password: password,
        role: "CUSTOMER",
        roleId: roleId,
        companyInternalId: companyId,
        customerId: panNumber,
      };

      const data = await authUtils.register(payload);
      alert("  Registration successful!\n\n📧 Admin will approve your account soon.\n\nYou'll be able to login after approval.");
      navigate("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      const message = err?.message || err?.msg || (typeof err === "string" ? err : "Registration failed");
      setError(message);
      alert("❌ " + (message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* LEFT SIDE */}
        <div className="flex-1 flex items-center justify-center p-4 bg-primary">
          <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-6 border border-border overflow-y-auto max-h-[90vh]">
            <h1 className="text-xl text-primary font-bold mb-4 text-center">
              Get Started Now, Entity
            </h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">

              {/* Entity Type */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Entity Type
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="">Select entity type</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {/* PAN */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="input-field"
                  maxLength={10}
                  disabled={loading}
                  placeholder="ABCDE1234F"
                />
              </div>

              {/* Entity Name */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Name of the Entity
                </label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="input-field"
                  disabled={loading}
                  placeholder="Your Company Name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Email ID
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  disabled={loading}
                  placeholder="you@example.com"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Name of Contact Person
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="input-field"
                  disabled={loading}
                  placeholder="John Doe"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Contact Person Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) =>
                    setContactPhone(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={10}
                  className="input-field"
                  disabled={loading}
                  placeholder="9876543210"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="input-field"
                  disabled={loading}
                  placeholder="Manager"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  disabled={loading}
                  placeholder="Chennai, Tamil Nadu"
                />
              </div>

              {/* Role Dropdown - Loaded from Backend */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Permission Role
                </label>
                {loadingRoles ? (
                  <div className="input-field text-gray-500">Loading roles...</div>
                ) : (
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="input-field"
                    disabled={loading}
                  >
                    <option value="">Select permission role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Company ID */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Company ID
                </label>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="input-field"
                  placeholder="COMPANY-001"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  disabled={loading}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || loadingRoles}
              >
                {loading ? "Registering..." : "Signup"}
              </button>
            </form>

            <p className="text-center text-sm text-primary mt-4">
              Have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-primary p-10">
          <div className="text-center max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-7">
              Making Markets Work for Small Farmholders
            </h2>

            <div className="relative w-72 h-72 mx-auto animate-spin-slow">
              <div className="absolute top-0 left-0">
                <Circle img={Agritrading} />
              </div>
              <div className="absolute top-0 right-0">
                <Circle img={logistics} />
              </div>
              <div className="absolute bottom-0 left-0">
                <Circle img={Pulses} />
              </div>
              <div className="absolute bottom-0 right-0">
                <Circle img={paddy} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;