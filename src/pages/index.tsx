import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { IRestaurant } from "@/models/Restaurant";
import { isRestaurantOpen } from "@/utils/restaurantStatus";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [restaurants, setRestaurants] = useState<Partial<IRestaurant>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuisine, setCuisine] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const ITEMS_PER_PAGE = 9;
  const { user,logout } = useAuth();

  useEffect(() => {

    console.log("userrrrr",user)
    const fetchRestaurants = async () => {
      try {
        console.log("Frontend: Fetching restaurants with params:", {
          cuisine,
          searchQuery,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });
        setLoading(true);

        const response = await axios.get("/api/restaurants", {
          params: {
            ...(cuisine && { cuisine }),
            ...(searchQuery && { search: searchQuery }),
            page: currentPage - 1,
            limit: ITEMS_PER_PAGE,
          },
        });

        console.log("Frontend: Response received:", response.data);

        setRestaurants(response.data.restaurants || []);

        const total =
          response.data.totalCount || response.data.pagination?.totalCount || 0;
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

        console.log(
          "Frontend: Restaurants set to state:",
          response.data.restaurants?.length || 0,
          "Total pages:",
          Math.ceil(total / ITEMS_PER_PAGE)
        );
      } catch (err) {
        console.error("Frontend: Error fetching restaurants:", err);
        setError("Failed to load restaurants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [cuisine, searchQuery, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const cuisineOptions = [
    "All",
    "Italian",
    "Mexican",
    "Chinese",
    "Japanese",
    "Indian",
    "American",
    "Thai",
  ];

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = Math.min(maxPagesToShow - 1, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - maxPagesToShow + 2);
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Food Delivery</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Admin
            </Link>
            {
              !user &&
              <>
              <Link href="/signin" className="text-blue-600 hover:underline">
              Sign In
            </Link>
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
            </>
            }
            {
              user &&
              <button onClick={logout}>logout</button>
            }
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Search for restaurants..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              >
                <option value="">All cuisines</option>
                {cuisineOptions.map((option) => (
                  <option key={option} value={option === "All" ? "" : option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading restaurants...</div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No restaurants found. Try a different search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant, index) => (
                <Link
                  href={`/restaurants/${restaurant._id}`}
                  key={restaurant._id ? restaurant._id.toString() : index}
                  className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48">
                    {restaurant.image ? (
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name || "Restaurant"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-500">No image available</p>
                      </div>
                    )}
                    {restaurant.featured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold">
                        {restaurant.name}
                      </h2>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span>{restaurant.rating?.toFixed(1) || "New"}</span>
                      </div>
                    </div>

                    {restaurant.cuisine && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.isArray(restaurant.cuisine) ? (
                          restaurant.cuisine.slice(0, 3).map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-800"
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-800">
                            {restaurant.cuisine}
                          </span>
                        )}
                      </div>
                    )}

                    <span
                      className={`px-2 py-1 rounded-full text-xs text-white ${
                        isRestaurantOpen(restaurant)
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {isRestaurantOpen(restaurant) ? "Open" : "Closed"}
                    </span>

                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div>
                        ${restaurant.deliveryFee?.toFixed(2) || "0.00"} delivery
                      </div>
                      <div>{restaurant.deliveryTime || "30-45"} min</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav
                  className="inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    typeof page === "number" ? (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${idx}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    )
                  )}

                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
