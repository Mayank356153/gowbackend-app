import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
export default function RegistrationForm() {
    const[form,setForm]=useState({
    name: '',
    studentId: '',
    email: '',
    otp: '',
    mobileNo: '',
    gender: '',
    hackerRankId: '',
    unstopId: '',
    branch: '',
    session: '',
    type: '',
    updates: false,
    })
    const handleChange = (e) => {
        setForm(prev=>({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', form);
    }
  return (
    <div className="bg-[#18181B] min-h-screen flex items-center justify-center font-sans">
      <div className="bg-[#232329] rounded-2xl shadow-lg flex w-full max-w-4xl overflow-hidden">
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

          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              {/* Name */}
              <input   
              value={form.name}
                onChange={handleChange}
                name="name"
                type="text" 
                placeholder="Name" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Student ID */}
              <input 
                value={form.studentId}
                onChange={handleChange}
                name="studentId"
                type="text" 
                placeholder="Student ID" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Email */}
              <div className="md:col-span-2">
                <input 
                    value={form.email}
                    onChange={handleChange}
                  type="email" 
                  placeholder="Email Address" 
                  className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* OTP */}
              <input 
                value={form.otp}
                onChange={handleChange}
                name="otp"
                type="text" 
                placeholder="OTP" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Mobile No */}
              <input 
                value={form.mobileNo}
                onChange={handleChange}
                name="mobileNo" 
                type="tel" 
                placeholder="Mobile No." 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Gender */}
              <div className="relative">
                <select className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.gender} onChange={handleChange} name="gender">
                  <option value="" disabled selected className="text-zinc-400">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                  <ChevronDown size={20} />
                </div>
              </div>

              {/* HackerRank ID */}
              <input 
                value={form.hackerRankId}
                onChange={handleChange}
                name="hackerRankId"
                type="text" 
                placeholder="HackerRank ID" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Unstop ID */}
              <input 
                value={form.unstopId}
                onChange={handleChange}
                name="unstopId"
                type="text" 
                placeholder="Unstop ID" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Branch */}
               <input 
                value={form.branch}
                onChange={handleChange}
                name="branch"
                type="text" 
                placeholder="Branch" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Session */}
              <input 
                value={form.session}
                onChange={handleChange}
                name="session"
                type="text" 
                placeholder="Session" 
                className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Hosteller/Day Scholar */}
              <div className="relative">
                <select className="w-full bg-[#33333A] border border-zinc-600 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.type} onChange={handleChange} name="type">
                  <option value="" disabled selected className="text-zinc-400">Type</option>
                  <option value="hosteller">Hosteller</option>
                  <option value="day-scholar">Day Scholar</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="flex items-center mt-8 mb-6">
              <input type="checkbox" value={form.updates} name="updates" id="updates" className="w-5 h-5 bg-[#33333A] border-zinc-600 rounded text-blue-500 focus:ring-blue-500" />
              <label htmlFor="updates" className="ml-3 text-zinc-400">I agree to receive updates about GDG events</label>
            </div>

            <button  onClick={handleSubmit}
              type="submit" 
              className="w-full px-4 py-3 font-bold text-white transition duration-300 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700"
            >
              Secure My Spot
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
