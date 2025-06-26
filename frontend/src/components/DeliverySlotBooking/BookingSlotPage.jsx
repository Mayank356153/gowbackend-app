import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // ✅ import Link

const BookingSlotPage = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const slotsPerPage = 15;

    const fetchSlots = async () => {
        try {
            const res = await fetch('api/all-slot');
            const data = await res.json();
            if (res.ok) {
                setSlots(data.slots || data);
            } else {
                setError(data.message || 'Failed to fetch slots');
                toast.error(data.message || 'Failed to fetch slots');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Server error. Please try again later.');
            toast.error('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, []);

    const indexOfLastSlot = currentPage * slotsPerPage;
    const indexOfFirstSlot = indexOfLastSlot - slotsPerPage;
    const currentSlots = slots.slice(indexOfFirstSlot, indexOfLastSlot);
    const totalPages = Math.ceil(slots.length / slotsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="w-full px-4 py-10 mx-auto">
            {/* Top header and button */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-blue-700">Available Booking Slots</h1>
                <Link
                    to="/delivery-slot-booking"
                    className="px-5 py-2 text-white transition bg-green-600 rounded hover:bg-green-700"
                >
                    Slot Booking
                </Link>
            </div>

            {loading && <p className="text-center text-gray-500">Loading slots...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && slots.length === 0 && (
                <p className="text-center text-gray-600">No booking slots available.</p>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {currentSlots.map((slot, idx) => (
                    <div key={idx} className="p-4 transition border rounded-lg shadow hover:shadow-md">
                        <h2 className="mb-2 text-xl font-semibold text-gray-800">{slot.date}</h2>
                        <p className="mb-1 text-gray-600">Time: <span className="font-medium">{slot.timeSlot}</span></p>
                        <p className="mb-1 text-gray-600">Charge: ₹{slot.charge}</p>
                        <p className="text-gray-600">Instant Delivery: {slot.isInstant ? 'Yes' : 'No'}</p>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {slots.length > slotsPerPage && (
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Previous
                    </button>
                    <span className="text-lg font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingSlotPage;
