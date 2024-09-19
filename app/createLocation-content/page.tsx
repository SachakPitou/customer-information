"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Make sure supabaseClient is correctly imported
import { useRouter } from "next/navigation";
import SideBar from "../component/SideBar";
import PopUpModal from "../component/popUpmodal";

export default function CreateLocation() {
  const router = useRouter();
  const [locationName, setLocationName] = useState<string>(""); // Correct typing for string
  const [insertedLocationId, setInsertedLocationId] = useState<number | null>(null); // Handle both null and number
  const [error, setError] = useState<string | null>(null); // Handle both string and null
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (insertedLocationId || error) {
      setIsModalOpen(true);
    }
  }, [insertedLocationId, error]);

  const handleAddLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Get the maximum location_id from the database
      const { data: maxLocationIdData, error: maxLocationIdError } = await supabase
        .from("Location")
        .select("location_id")
        .order("location_id", { ascending: false })
        .limit(1)
        .single();

      if (maxLocationIdError) {
        throw new Error(maxLocationIdError.message);
      }

      // Calculate the new location_id by incrementing the maximum location_id by 1
      const newLocationId = maxLocationIdData ? maxLocationIdData.location_id + 1 : 1;

      // Insert the new location with the calculated location_id
      const { data, error: insertError } = await supabase
        .from("Location")
        .insert([
          {
            location_id: newLocationId,
            location_name: locationName, // locationName is typed as a string
          },
        ]);

      if (insertError) throw new Error(insertError.message);

      setInsertedLocationId(newLocationId); // Correctly set the new location ID
      setLocationName(""); // Reset locationName after successful insert
    } catch (error: any) { // Typing error as 'any' to handle both string and other cases
      setError(error.message || "An unknown error occurred.");
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button
          onClick={() => router.back()}
          type="button"
          className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700"
        >
          <svg
            className="w-5 h-5 rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Location: </span>
        <form onSubmit={handleAddLocation} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-full p-2">
            <label htmlFor="locationName" className="block mb-2">
              Location Name:
            </label>
            <input
              type="text"
              id="locationName"
              placeholder="Enter location name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full p-2 text-center">
            <button type="submit" className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600">
              Add Location
            </button>
          </div>
        </form>
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={insertedLocationId ? "Success" : "Error"}
          content={
            <>
              {insertedLocationId && (
                <p className="text-center text-green-700 mt-4">
                  Location created successfully with ID: {insertedLocationId}
                </p>
              )}
              {error && <p className="text-center text-red-700 mt-4">Error creating location: {error}</p>}
            </>
          }
        />
      </div>
    </div>
  );
}
