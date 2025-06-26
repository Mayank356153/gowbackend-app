import React, { useState, useEffect } from "react";
import { useGeolocated } from "react-geolocated";
// 1) Import the useNavigate hook from react-router-dom
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
const StoreTab = () => {
  const navigate = useNavigate(); // 2) Create a navigate function
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // if present, we're in edit mode
  const countries = {
    India: ["Andhra Pradesh", "Delhi", "Goa", "Karnataka", "Maharashtra"],
    USA: ["California", "Texas", "Florida", "New York"],
    Canada: ["Ontario", "Quebec", "British Columbia"],
  };
 
  // Existing state variables
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [Phone, setPhone] = useState("");
  const [Country, setCountry] = useState("");
  const [GST_NUMBER, setGST_NUMBER] = useState("");
  const [Tax_Number, setTax_Number] = useState("");
  const [Pan_Number, setPan_Number] = useState("");
  const [Bank_Details, setBank_Details] = useState("");
  const [store_website, setstore_website] = useState("");
  const [PostCode, setPostCode] = useState("");
  const [state, setState] = useState("");
  const [City, setCity] = useState("");
  const [Address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [localPermissions, setLocalPermissions] = useState([]);
  const[storeCode,setStoreCode]=useState("")
  function generateNewStoreCode(lastCode) {
    const prefix = "STORE";
    const numberPart = parseInt(lastCode.replace(prefix, ""), 10);
    const newNumber = numberPart + 1;
  
    // Pad the number with leading zeros to keep it 3 digits
    const newCode = prefix + String(newNumber).padStart(3, '0');
    return newCode;
  }
  function generateNewStoreCode(lastCode) {
    const prefix = "STORE";
    const match = lastCode.match(/^STORE(\d+)$/i);
  
    if (!match) {
      throw new Error("Invalid store code format");
    }
  
    const number = match[1];
    const newNumber = parseInt(number, 10) + 1;
  
    // Pad to at least 2 digits (e.g., 01, 02, ..., 10, 99, 100, etc.)
    const newCode = prefix + String(newNumber).padStart(2, '0');
    console.log(newCode);
    return newCode;
  }
  
 
  
  useEffect(() => {
    const fetchStores = async () => {
      const token = localStorage.getItem("token");
      try {
        // Make sure this matches your actual backend GET route
        const response = await fetch("http://localhost:5000/admin/store/add/store", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch stores");
        }
        const data = await response.json();
       console.log(data)
       const lastcode=data.result[data.result.length-1].StoreCode
       setStoreCode(generateNewStoreCode(lastcode))
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };
    fetchStores();
  }, []);
  // For Latitude and Longitude
  const [Latitude, setLatitude] = useState("");
  const [Longitude, setLongitude] = useState("");

  // Use react-geolocated to auto-fetch coordinates
  const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError } =
    useGeolocated({
      positionOptions: { enableHighAccuracy: false },
      userDecisionTimeout: 5000,
    });

  // Update Latitude and Longitude when coords change
  useEffect(() => {
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
    }
  }, [coords]);

  // Load permissions from localStorage
  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        setLocalPermissions(JSON.parse(storedPermissions));
      } catch (error) {
        console.error("Error parsing permissions:", error);
        setLocalPermissions([]);
      }
    } else {
      setLocalPermissions([]);
    }
  }, []);

  const hasPermissionFor = (module, action) => {
    const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
    if (userRole === "admin") return true;
    return localPermissions.some(
      (perm) =>
        perm.module.toLowerCase() === module.toLowerCase() &&
        perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  if (!hasPermissionFor("stores", "add")) {
    return <div>Insufficient permissions to add a store.</div>;
  }

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
    setState(""); // Reset state when country changes
  };

  // Optional manual refresh for location
  const handleGetLocation = () => {
    if (!isGeolocationAvailable) {
      alert("Geolocation is not available in your browser.");
    } else if (!isGeolocationEnabled) {
      alert("Geolocation is not enabled. Please enable location services.");
    } else if (positionError) {
      alert("Error fetching location. Please enter manually.");
    } else {
      alert("Location auto-fetched.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", {
      StoreCode:storeCode,
      username,
      firstName,
      mobile,
      email,
      Phone,
      GST_NUMBER,
      Tax_Number,
      Pan_Number,
      store_website,
      Bank_Details,
      Country,
      state,
      City,
      PostCode,
      Address,
      Latitude,
      Longitude,
    });

    const formData = {
      StoreCode: storeCode,
      StoreName: firstName,
      Mobile: mobile,
      Email: email,
      Phone: Phone,
      Gst_Number: GST_NUMBER,
      Tax_Number: Tax_Number,
      Pan_Number: Pan_Number,
      Store_website: store_website,
      Bank_details: Bank_Details,
      Country: Country,
      State: state,
      City: City,
      PostCode: PostCode,
      Address: Address,
      Latitude,
      Longitude,
    };

    // Retrieve token from localStorage (make sure it's stored)
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://localhost:5000/admin/Store/add/Store",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create store");
      }
      const result = await response.json();
      console.log("Store created successfully", result);
      // 3) Show a success popup
      alert("Store saved successfully!");

      // Reset fields after successful submission
      setUsername("");
      setFirstName("");
      setMobile("");
      setEmail("");
      setPhone("");
      setGST_NUMBER("");
      setTax_Number("");
      setPan_Number("");
      setstore_website("");
      setBank_Details("");
      setCountry("");
      setState("");
      setCity("");
      setPostCode("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setStoreCode(generateNewStoreCode(storeCode))
    } catch (error) {
      console.error("Error", error);
      alert(error.message); // Optionally show an error alert
    }
  };

  const handleClose = () => {
    // Reset the form fields (or navigate away, as needed)
    setUsername("");
    setFirstName("");
    setMobile("");
    setEmail("");
    setPhone("");
    setGST_NUMBER("");
    setTax_Number("");
    setPan_Number("");
    setstore_website("");
    setBank_Details("");
    setCountry("");
    setState("");
    setCity("");
    setPostCode("");
    setAddress("");
    setLatitude("");
    setLongitude("");
    console.log("Form closed and fields reset.");
    // 4) Navigate back to your dashboard (adjust route as needed)
    navigate("/dashboard");
  };

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  return (
    <div className="mx-auto overflow-y-auto">
      <form onSubmit={handleSubmit}>
        {/* Main Row for Form Fields */}
        <div className="flex gap-20">
          <div className="flex w-full gap-32">
            {/* Left Column */}
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="username" className="block mb-2 font-medium">
                  StoreCode*
                </label>
                <input
                  id="username"
                  type="text"
                  value={storeCode}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block mb-2 font-medium">
                  Store Name*
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block mb-2 font-medium">
                  Mobile
                </label>
                <input
                  id="mobile"
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Phone" className="block mb-2 font-medium">
                  Phone*
                </label>
                <input
                  id="Phone"
                  type="text"
                  value={Phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="GST_NUMBER" className="block mb-2 font-medium">
                  GST Number*
                </label>
                <input
                  id="GST_NUMBER"
                  type="text"
                  value={GST_NUMBER}
                  onChange={(e) => setGST_NUMBER(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Tax_Number" className="block mb-2 font-medium">
                  Tax Number*
                </label>
                <input
                  id="Tax_Number"
                  type="text"
                  value={Tax_Number}
                  onChange={(e) => setTax_Number(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="Pan_Number" className="block mb-2 font-medium">
                  Pan Number*
                </label>
                <input
                  id="Pan_Number"
                  type="text"
                  value={Pan_Number}
                  onChange={(e) => setPan_Number(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Store_website" className="block mb-2 font-medium">
                  Store Website*
                </label>
                <input
                  id="Store_website"
                  type="text"
                  value={store_website}
                  onChange={(e) => setstore_website(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Bank_Details" className="block mb-2 font-medium">
                  Bank Details
                </label>
                <input
                  id="Bank_Details"
                  type="text"
                  value={Bank_Details}
                  onChange={(e) => setBank_Details(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="country" className="block mb-2 font-medium">
                  Country*
                </label>
                <select
                  id="country"
                  value={Country}
                  onChange={handleCountryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Country</option>
                  {Object.keys(countries).map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              {Country && (
                <div>
                  <label htmlFor="state" className="block mb-2 font-medium">
                    State*
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select State</option>
                    {countries[Country]?.map((stateOption, index) => (
                      <option key={index} value={stateOption}>
                        {stateOption}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="City" className="block mb-2 font-medium">
                  City*
                </label>
                <input
                  id="City"
                  type="text"
                  value={City}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="PostCode" className="block mb-2 font-medium">
                  PostCode*
                </label>
                <input
                  id="PostCode"
                  type="text"
                  value={PostCode}
                  onChange={(e) => setPostCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Address" className="block mb-2 font-medium">
                  Address*
                </label>
                <input
                  id="Address"
                  type="text"
                  value={Address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Display Latitude & Longitude */}
              <div>
                <p>
                  <strong>Latitude:</strong> {Latitude || "Not set"}
                </p>
                <p>
                  <strong>Longitude:</strong> {Longitude || "Not set"}
                </p>
              </div>
              {/* Manual Refresh Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Refresh Location
                </button>
              </div>
            </div>
          </div>

          {/* Profile Picture Column */}
          <div className="space-y-4">
            <label htmlFor="profilePicture" className="block mb-2 font-medium">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <input
                id="profilePicture"
                type="file"
                onChange={handleProfilePictureChange}
                className="block w-full sm:w-auto"
              />
              {profilePicture && (
                <img
                  src={URL.createObjectURL(profilePicture)}
                  alt="Profile"
                  className="max-w-[150px] max-h-[150px] rounded-md border border-gray-300"
                />
              )}
            </div>
          </div>
        </div>

        {/* Separate Row for Save & Close Buttons */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            type="submit"
            className="px-6 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreTab;
