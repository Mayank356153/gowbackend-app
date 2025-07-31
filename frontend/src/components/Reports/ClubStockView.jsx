import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
const ClubStockView = ({ item,setView,items,warehouses }) => {
    const [store, setStore] = React.useState(0);
    const [van, setVan] = React.useState(0);
    // Render nothing if the modal isn't open
    

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  
   const openStockModala = async (item) => {
    try {
      const active = warehouses.filter((w) => w.value !== "all");
      const reqs = active.map((w) =>
        axios.get("https://pos.inspiredgrow.in/vps/api/items", {
          ...auth(),
          params: { warehouse: w.value, search: item.itemCode, page: 1, limit: 1 },
        })
      );
      const res = await Promise.allSettled(reqs);
      console.log(res)
      const stocksByWh = res.map((r, i) => {
        const wh = active[i];
        if (r.status !== "fulfilled") return { id: wh.value, name: wh.label, stock: "N/A",restricted: wh.restricted };
        const row = r.value.data.data?.[0];
        return { id: wh.value, name: wh.label, stock: row ? row.currentStock ?? 0 : 0,restricted: wh.restricted };
      });




      
           stocksByWh.forEach(w=>{
 if(w.restricted){
            setStore(prev=>prev+w.stock);   
        }
        else{
            setVan(prev=>prev+w.stock);
        }
      }
       
      )
                console.log({ ...item, stocksByWh });
    } catch {
      alert("Failed to load stock breakdown.");
    }
  };
  useEffect(() => {   
    openStockModala(item);   
}, [item]);
    return (
        // Overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-60 backdrop-blur-sm">
            
            {/* Modal Content */}
            <div className="relative w-full max-w-sm p-8 bg-white shadow-xl rounded-2xl">
                
                {/* Close Button */}
                <button 
                    onClick={() => setView(false)} 
                    className="absolute p-2 text-gray-400 rounded-full top-3 right-3 hover:bg-gray-100"
                    aria-label="Close"
                >
                    <FaTimes size={20} />
                </button>

                {/* Simplified Content */}
                <div className="text-center">
                   
                    <h2 className="mb-6 text-xl font-bold text-gray-800">{item.itemName}</h2>

                    <div className="flex justify-around">
                        {/* Required Quantity */}
                        <div>
                            <p className="text-sm text-gray-600">Store Stock</p>
                            <p className="text-4xl font-bold">{store}</p>
                        </div>
                        {/* Free Quantity */}
                        <div>
                            <p className="text-sm text-gray-600">Van Stock</p>
                            <p className="text-4xl font-bold ">{van}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClubStockView;