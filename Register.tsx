import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import ReCAPTCHA from "react-google-recaptcha";

export default function RegistrationForm() {
    const [captchaValue, setCaptchaValue] = useState(null)
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSendingOTP, setIsSendingOTP] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' or 'error'

    // Set your backend API base URL
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const CAPTCHA_SITE = import.meta.env.VITE_CAPTCHA_SITE;

    const handleCaptcha = (value) => {
        console.log("Captcha value:", value);
        setCaptchaValue(value);
    };

    const [form, setForm] = useState({
        name: '',
        studentNo: '',
        email: '',
        otp: '',
        phone: '',
        gender: '',
        hackerrankId: '',
        unstopId: '',
        branch: '',
        hostelStatus: '',
        domain: '',
        updates: false,
    })

    // Validation functions
    const validateName = (name) => {
        const trimmed = name.trim();
        if (!trimmed) return "Name is required";
        return null;
    };

    const validateStudentNo = (studentNo) => {
    const trimmed = studentNo.trim();
    if (!trimmed) return "Student number is required";
    if (!trimmed.startsWith("24")) return "Only 2nd year students are eligible";
    return null;
};

    const validateEmail = (email) => {
        if (!email) return "Email is required";
        // Updated regex to match backend validation
        const collegeEmailRegex = /^[a-z]+[0-9]{7,8}@akgec\.ac\.in$/;
        if (!collegeEmailRegex.test(email)) {
            return "Please register using your official college email (e.g., yourname1234567@akgec.ac.in)";
        }
        return null;
    };

    const validatePhone = (phone) => {
        // Basic mobile phone validation (Indian format)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phone) return "Phone number is required";
        if (!phoneRegex.test(phone)) return "Valid phone number is required";
        return null;
    };

    const validateBranch = (branch) => {
        if (!branch) return "Branch is required";
        return null;
    };

    const validateHostelStatus = (status) => {
        // Updated to match backend validation
        const validStatuses = ["Hosteler", "Day Scholar"];
        if (!status) return "Hostel status is required";
        if (!validStatuses.includes(status)) return "Invalid hostel status";
        return null;
    };

    const validateGender = (gender) => {
        // Updated to match backend validation (removed "other")
        const validGenders = ["male", "female"];
        if (!gender) return "Gender is required";
        if (!validGenders.includes(gender)) return "Gender must be Male or Female";
        return null;
    };

    const validateHackerRankId = (id) => {
        const trimmed = id.trim();
        if (!trimmed) return "HackerRank ID is required";
        const regex = /^[a-zA-Z0-9_.-]{3,30}$/;
        if (!regex.test(trimmed)) {
            return "Enter valid HackerRank ID";
        }
        return null;
    };

    const validateUnstopId = (id) => {
        const trimmed = id.trim();
        if (!trimmed) return "Unstop ID is required";
        const regex = /^[a-zA-Z0-9_.-]{3,30}$/;
        if (!regex.test(trimmed)) {
            return "Enter valid Unstop ID";
        }
        return null;
    };

    const validateDomain = (domain) => {
        if (!domain) return "Domain is required";
        return null;
    };

    const validateOTP = (otp) => {
        if (!otp) return "OTP is required";
        if (otp.length !== 6) return "OTP must be 6 digits";
        if (!/^\d{6}$/.test(otp)) return "OTP must contain only numbers";
        return null;
    };

    // Validate form for OTP sending
    const validateFormForOTP = () => {
        const newErrors = {};

        const nameError = validateName(form.name);
        if (nameError) newErrors.name = nameError;

        const studentNoError = validateStudentNo(form.studentNo);
        if (studentNoError) newErrors.studentNo = studentNoError;

        const emailError = validateEmail(form.email);
        if (emailError) newErrors.email = emailError;

        const phoneError = validatePhone(form.phone);
        if (phoneError) newErrors.phone = phoneError;

        const branchError = validateBranch(form.branch);
        if (branchError) newErrors.branch = branchError;

        const hostelError = validateHostelStatus(form.hostelStatus);
        if (hostelError) newErrors.hostelStatus = hostelError;

        const genderError = validateGender(form.gender);
        if (genderError) newErrors.gender = genderError;

        const hackerRankError = validateHackerRankId(form.hackerrankId);
        if (hackerRankError) newErrors.hackerrankId = hackerRankError;

        const unstopError = validateUnstopId(form.unstopId);
        if (unstopError) newErrors.unstopId = unstopError;

        // Note: Domain is not required by backend, so we'll remove this validation
        // const domainError = validateDomain(form.domain);
        // if (domainError) newErrors.domain = domainError;

        if (!captchaValue) {
            newErrors.captcha = "Please complete the captcha";
        }

        return newErrors;
    };

    // Validate all fields including OTP
    const validateForm = () => {
        const formErrors = validateFormForOTP();
        
        const otpError = validateOTP(form.otp);
        if (otpError) formErrors.otp = otpError;

        return formErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    }

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let error = null;

        switch (name) {
            case 'name':
                error = validateName(value);
                break;
            case 'studentNo':
                error = validateStudentNo(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
            case 'branch':
                error = validateBranch(value);
                break;
            case 'hostelStatus':
                error = validateHostelStatus(value);
                break;
            case 'gender':
                error = validateGender(value);
                break;
            case 'hackerrankId':
                error = validateHackerRankId(value);
                break;
            case 'unstopId':
                error = validateUnstopId(value);
                break;
            case 'domain':
                error = validateDomain(value);
                break;
            case 'otp':
                error = validateOTP(value);
                break;
        }

        if (error) {
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    // Send OTP function
    const handleSendOTP = async () => {
        setIsSendingOTP(true);
        setMessage('');
        setMessageType('');

        const formErrors = validateFormForOTP();
        
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            setIsSendingOTP(false);
            return;
        }

        console.log('Sending registration data:', form);

        try {
            const registrationData = {
                name: form.name,
                studentNo: form.studentNo,
                branch: form.branch,
                gender: form.gender,
                email: form.email,
                phone: form.phone,
                hostelStatus: form.hostelStatus,
                reCaptchaValue: captchaValue,
                hackerrankId: form.hackerrankId,
                unstopId: form.unstopId,
            };

            console.log('Registration payload:', registrationData);

            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData)
            });

            const data = await response.json();
            console.log('Backend response:', data);

            if (response.ok) {
                setMessage(data.message);
                setMessageType('success');
                setOtpSent(true);
                setErrors({});
            } else {
                if (data.error) {
                    setMessage(data.error);
                    setMessageType('error');
                } else if (data.errors) {
                    // Handle validation errors from express-validator
                    const backendErrors = {};
                    data.errors.forEach(err => {
                        backendErrors[err.path || err.param] = err.msg;
                    });
                    setErrors(backendErrors);
                    setMessage('Please fix the validation errors');
                    setMessageType('error');
                } else {
                    setMessage('Failed to send OTP. Please try again.');
                    setMessageType('error');
                }
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            setMessage('Network error. Please check your connection and try again.');
            setMessageType('error');
        } finally {
            setIsSendingOTP(false);
        }
    };

    // Resend OTP function
    const handleResendOTP = async () => {
        setIsSendingOTP(true);
        setMessage('');
        setMessageType('');

        try {
            const response = await fetch(`${API_BASE_URL}/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: form.email
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setMessageType('success');
            } else {
                setMessage(data.error || 'Failed to resend OTP. Please try again.');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            setMessage('Network error. Please try again.');
            setMessageType('error');
        } finally {
            setIsSendingOTP(false);
        }
    };

    // Submit form function
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setMessageType('');

        const formErrors = validateForm();
        
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: form.email,
                    otp: form.otp
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setMessageType('success');
                setErrors({});
                
                // Reset form after successful registration
                setTimeout(() => {
                    setForm({
                        name: '',
                        studentNo: '',
                        email: '',
                        otp: '',
                        phone: '',
                        gender: '',
                        hackerrankId: '',
                        unstopId: '',
                        branch: '',
                        hostelStatus: '',
                        domain: '',
                        updates: false,
                    });
                    setOtpSent(false);
                    setCaptchaValue(null);
                    setMessage('');
                }, 5000);
                
            } else {
                setMessage(data.error || 'Failed to verify OTP. Please try again.');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            setMessage('Network error. Please try again.');
            setMessageType('error');
        } finally {
            setIsSubmitting(false);
        }
    }

    const getInputClassName = (fieldName) => {
        const baseClass = "w-full bg-[#33333A] border rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2";
        const errorClass = errors[fieldName] ? "border-red-500 focus:ring-red-500" : "border-zinc-600 focus:ring-blue-500";
        return `${baseClass} ${errorClass}`;
    };

    const getSelectClassName = (fieldName) => {
        const baseClass = "w-full bg-[#33333A] border rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2";
        const errorClass = errors[fieldName] ? "border-red-500 focus:ring-red-500" : "border-zinc-600 focus:ring-blue-500";
        return `${baseClass} ${errorClass}`;
    };

    return (
        <div id='register' className='relative z-1 floating-dots'>
            <div className="flex items-center justify-center min-h-screen font-sans">
                <div className="flex w-full max-w-4xl overflow-hidden shadow-lg rounded-2xl">
                    {/* Left Side - Image */}
                    <div className="hidden w-1/2 md:block">
                        <img 
                            src="./register.png" 
                            alt="Gaming event with blue neon lights" 
                            className="object-cover w-full h-full"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x800/18181B/FFFFFF?text=Event+Image'; e.currentTarget.onerror = null; }}
                        />
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full p-8 text-white md:w-1/2 md:p-12">
                        <h2 className="mb-4 text-3xl font-bold">Register Now</h2>
                        <p className="mb-8 text-zinc-400">
                            Please fill out the form below to complete your registration.
                        </p>

                        {/* Message Display */}
                        {message && (
                            <div className={`mb-4 p-3 rounded-lg ${messageType === 'success' ? 'bg-green-600/20 border border-green-500 text-green-300' : 'bg-red-600/20 border border-red-500 text-red-300'}`}>
                                {message}
                            </div>
                        )}

                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                {/* Name */}
                                <div>
                                    <input   
                                        value={form.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="name"
                                        type="text" 
                                        placeholder="Name" 
                                        className={getInputClassName('name')}
                                        disabled={otpSent}
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                                </div>
                                
                                {/* Student No */}
                                <div>
                                    <input 
                                        value={form.studentNo}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="studentNo"
                                        type="text" 
                                        placeholder="Student Number" 
                                        className={getInputClassName('studentNo')}
                                        disabled={otpSent}
                                    />
                                    {errors.studentNo && <p className="mt-1 text-sm text-red-400">{errors.studentNo}</p>}
                                </div>

                                {/* Email */}
                                <div className="md:col-span-2">
                                    <input 
                                        value={form.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="email"
                                        type="email" 
                                        placeholder="Email Address" 
                                        className={getInputClassName('email')}
                                        disabled={otpSent}
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <input 
                                        value={form.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="phone" 
                                        type="tel" 
                                        placeholder="Mobile No." 
                                        className={getInputClassName('phone')}
                                        disabled={otpSent}
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                                </div>

                                {/* Gender - Removed "Other" option to match backend */}
                                <div className="relative">
                                    <select 
                                        className={getSelectClassName('gender')} 
                                        value={form.gender} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="gender"
                                        disabled={otpSent}
                                    >
                                        <option value="" disabled className="text-zinc-400">Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                                        <ChevronDown size={20} />
                                    </div>
                                    {errors.gender && <p className="mt-1 text-sm text-red-400">{errors.gender}</p>}
                                </div>

                                {/* Domain - Keep for UI but don't validate */}
                                <div className="relative">
                                    <select 
                                        className={getSelectClassName('domain')} 
                                        value={form.domain} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="domain"
                                        disabled={otpSent}
                                    >
                                        <option value="" disabled className="text-zinc-400">Domain</option>
                                        <option value="web-development">Web Development</option>
                                        <option value="machine-learning">Machine Learning</option>
                                        <option value="app-development">App Development</option>
                                        <option value="ui-ux-designing">UI/UX Designing</option>
                                        <option value="management">Management</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                                        <ChevronDown size={20} />
                                    </div>
                                    {errors.domain && <p className="mt-1 text-sm text-red-400">{errors.domain}</p>}
                                </div>

                                {/* HackerRank ID */}
                                <div>
                                    <input 
                                        value={form.hackerrankId}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="hackerrankId"
                                        type="text" 
                                        placeholder="HackerRank ID" 
                                        className={getInputClassName('hackerrankId')}
                                        disabled={otpSent}
                                        autoComplete='off'
                                    />
                                    {errors.hackerrankId && <p className="mt-1 text-sm text-red-400">{errors.hackerrankId}</p>}
                                </div>

                                {/* Unstop ID */}
                                <div>
                                    <input 
                                        value={form.unstopId}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="unstopId"
                                        type="text" 
                                        placeholder="Unstop ID" 
                                        className={getInputClassName('unstopId')}
                                        disabled={otpSent}
                                        autoComplete='off'
                                    />
                                    {errors.unstopId && <p className="mt-1 text-sm text-red-400">{errors.unstopId}</p>}
                                </div>

                                {/* Branch */}
                                <div className="relative">
                                    <select 
                                        className={getSelectClassName('branch')} 
                                        value={form.branch} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="branch"
                                        disabled={otpSent}
                                    >
                                        <option value="" disabled className="text-zinc-400">Branch</option>
                                        <option value="CSE">CSE</option>
                                        <option value="CSE(AIML)">CSE(AIML)</option>
                                        <option value="CSE(DS)">CSE(DS)</option>
                                        <option value="CSE(HINDI)">CSE(HINDI)</option>
                                        <option value="CS">CS</option>
                                        <option value="CSIT">CSIT</option>
                                        <option value="IT">IT</option>
                                        <option value="ECE">ECE</option>
                                        <option value="EN">EN</option>
                                        <option value="ME">ME</option>
                                        <option value="CIVIL">CIVIL</option>
                                        <option value="AIML">AIML</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                                        <ChevronDown size={20} />
                                    </div>
                                    {errors.branch && <p className="mt-1 text-sm text-red-400">{errors.branch}</p>}
                                </div>

                                {/* Hostel Status - Updated values to match backend */}
                                <div className="relative">
                                    <select 
                                        className={getSelectClassName('hostelStatus')} 
                                        value={form.hostelStatus} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="hostelStatus"
                                        disabled={otpSent}
                                    >
                                        <option value="" disabled className="text-zinc-400">Hostel Status</option>
                                        <option value="Hosteler">Hosteller</option>
                                        <option value="Day Scholar">Day Scholar</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                                        <ChevronDown size={20} />
                                    </div>
                                    {errors.hostelStatus && <p className="mt-1 text-sm text-red-400">{errors.hostelStatus}</p>}
                                </div>

                                {/* OTP */}
                                <div>
                                    <input 
                                        value={form.otp}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="otp"
                                        type="text" 
                                        placeholder={otpSent ? "Enter 6-digit OTP" : "OTP (will be enabled after sending)"} 
                                        className={getInputClassName('otp')}
                                        disabled={!otpSent}
                                        maxLength="6"
                                    />
                                    {errors.otp && <p className="mt-1 text-sm text-red-400">{errors.otp}</p>}
                                </div>

                                {/* Send OTP / Resend OTP Button */}
                                <button  
                                    type="button"
                                    onClick={otpSent ? handleResendOTP : handleSendOTP}
                                    disabled={isSendingOTP}
                                    className="w-full px-4 py-3 font-bold text-white transition duration-300 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSendingOTP ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Send OTP')}
                                </button>
                            </div>

                            <div className="flex items-center mt-8 mb-6">
                                <input 
                                    type="checkbox" 
                                    checked={form.updates} 
                                    onChange={(e) => setForm(prev => ({...prev, updates: e.target.checked}))} 
                                    name="updates" 
                                    id="updates" 
                                    className="w-5 h-5 bg-[#33333A] border-zinc-600 rounded text-blue-500 focus:ring-blue-500" 
                                />
                                <label htmlFor="updates" className="ml-3 text-zinc-400">I agree to receive updates about GDG events</label>
                            </div>

                            <div className='pb-2'>
                                <ReCAPTCHA 
                                    sitekey={CAPTCHA_SITE}
                                    onChange={handleCaptcha} 
                                />
                                {errors.captcha && <p className="mt-1 text-sm text-red-400">{errors.captcha}</p>}
                            </div>

                            

                            <button  
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !otpSent}
                                className="w-full px-4 py-3 font-bold text-white transition duration-300 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Verifying...' : 'Secure My Spot'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}