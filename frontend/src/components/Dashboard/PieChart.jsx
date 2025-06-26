import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useEffect,useState } from 'react';
import axios from 'axios';
const data = [
  { name: 'Item 1', value: 400 },
  { name: 'Item 2', value: 300 },
  { name: 'Item 3', value: 300 },
  { name: 'Item 4', value: 200 },
  { name: 'Item 5', value: 278 },
  { name: 'Item 6', value: 189 },
  { name: 'Item 7', value: 239 },
  { name: 'Item 8', value: 349 },
  { name: 'Item 9', value: 450 },
  { name: 'Item 10', value: 120 },
];

const COLORS = [
  '#8884d8', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57',
  '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042',
];

export default function TrendingItemsDonut() {
  const[data,setData]=useState([])
  const fetchTrendingItems = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/items/top-trending?limit=10',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      const newData=response.data.data.map((item)=>({
        name:item.itemName,
        value:item.totalSold
      }))
      console.log(newData)
      setData(newData)
      console.log(response.data)
    } catch (err) {
      console.log(err.message);
    } 
  };
 
  useEffect(()=>{
    fetchTrendingItems();
  },[])
  return (
    <div className="flex flex-col items-center w-full">
    <h2 className="mb-4 text-lg font-semibold">TOP 10 TRENDING ITEMS</h2>

    {/* Pie Chart */}
    <PieChart width={400} height={400}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={100}
        outerRadius={160}
        fill="#8884d8"
        paddingAngle={3}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>

    {/* Custom Legend */}
    <div className="flex flex-wrap justify-center w-full max-w-md gap-4 mt-4">
      {data.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span>{entry.name}</span>
        </div>
      ))}
    </div>
  </div>
  );
}
