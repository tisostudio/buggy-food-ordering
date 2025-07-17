import { useAuth } from "@/hooks/useAuth";
import connectDB from "@/lib/db";
import { MenuItem } from "@/models/Restaurant";
import { useCartStore } from "@/store/cartStore";
import { isRestaurantOpen as checkRestaurantOpen } from "@/utils/restaurantStatus";
import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface RestaurantDetails {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  image: string;
  cuisine: string[];
  deliveryTime?: number;
  deliveryFee?: number;
  minOrderAmount?: number;
  rating?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  menu: MenuItem[];
  hours?: Record<string, { open: string; close: string }>;
  openingHours?: {
    open: string;
    close: string;
    daysOpen: number[];
  };
  manuallyClosed?: boolean;
}

const RestaurantDetail: NextPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean>(true);
  const router = useRouter();
  const { id } = router.query;
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addItem, items } = useCartStore();
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) throw new Error("Failed to fetch restaurant");

        const data = await response.json();
        console.log("Fetched restaurant data:", data);
        setRestaurant(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    if (!restaurant) return;

    console.log("Restaurant data in open check:", {
      id: restaurant._id || restaurant.id,
      name: restaurant.name,
      hours: restaurant.hours,
      openingHours: restaurant.openingHours,
      manuallyClosed: restaurant.manuallyClosed,
    });

    setIsRestaurantOpen(checkRestaurantOpen(restaurant));
  }, [restaurant]);

  const categories = restaurant?.menu
    ? Array.from(
        new Set(restaurant.menu.map((item) => item.category).filter(Boolean)),
      )
    : [];

  const getMenuItemsByCategory = (category: string | null) => {
    if (!restaurant?.menu) return [];

    if (category === null) {
      return restaurant.menu;
    }

    return restaurant.menu.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    );
  };

  const filteredMenuItems = getMenuItemsByCategory(selectedCategory);

  const addItemToCart = useCallback(
  (menuItem: MenuItem) => {
    console.log("restaurant", restaurant);
    if (!restaurant) return;
    if (!user) {
      toast.error("Please login in order to add item to the cart");
      return;
    }
    if (!isRestaurantOpen) {
      toast.error("Restaurant is not open, please try again later");
      return;
    }

    const restaurantId = restaurant._id || restaurant.id || "";
    const cartItemId = `${restaurantId}-${menuItem.name}`;

    // Check if cart already has items from another restaurant
    const currentRestaurantId = useCartStore.getState().restaurantId;
    const cartHasItems = useCartStore.getState().items.length > 0;

    if (
      cartHasItems &&
      currentRestaurantId &&
      currentRestaurantId !== restaurantId
    ) {
      const confirmed = window.confirm(
        "Your cart contains items from a different restaurant. Do you want to clear the cart and add this item?"
      );

      if (!confirmed) return;

      // Clear the cart before adding
      useCartStore.getState().clearCart();
    }

    useCartStore.getState().addItem({
      id: cartItemId,
      restaurantId,
      menuItem,
      quantity: 1,
    });

    toast.success("Item added to cart");
  },
  [restaurant, isRestaurantOpen, user],
);

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed bottom-8 right-8 z-50">
        <Link href="/cart" legacyBehavior>
          <a className="flex items-center justify-center w-16 h-16 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartItemCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {cartItemCount}
                </div>
              )}
            </div>
          </a>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 bg-white">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : restaurant ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-72">
              <Image
                src={restaurant.image || "/placeholder-restaurant.jpg"}
                alt={restaurant.name}
                layout="fill"
                objectFit="cover"
                className="w-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {restaurant.name}
                </h1>
                <div className="flex items-center text-white mb-3">
                  <div className="flex items-center mr-6">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span>
                      {restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        isRestaurantOpen ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    <span>
                      {isRestaurantOpen
                        ? "Open"
                        : `Closed (Opens from ${restaurant.openingHours?.open} to ${restaurant.openingHours?.close})`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap text-sm text-white">
                  <div className="mr-6 flex items-center">
                    <span className="mr-1">🚲</span>
                    <span>
                      {restaurant.deliveryTime
                        ? restaurant.deliveryTime
                        : "N/A"}{" "}
                      min
                    </span>
                  </div>
                  <div className="mr-6 flex items-center">
                    <span className="mr-1">💵</span>
                    <span>
                      Delivery: $
                      {restaurant.deliveryFee
                        ? restaurant.deliveryFee.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="mr-6 flex items-center">
                    <span className="mr-1">🛒</span>
                    <span>
                      Min Order: $
                      {restaurant.minOrderAmount
                        ? restaurant.minOrderAmount.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  About
                </h2>
                <p className="text-gray-700">{restaurant.description}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Menu
                </h2>
                <div className="overflow-x-auto pb-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap ${
                        selectedCategory === null
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    <div className="flex flex-wrap gap-2 items-center">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border ${
                            selectedCategory === category
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.name}
                      className="border rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex">
                        <div className="flex-grow">
                          <h3 className="font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-gray-900 font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                            {item.available ?
                              <button
                                onClick={() => addItemToCart(item)}
                                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                              >
                                Add to Cart
                              </button>
                              :
                              <p>not available</p>
                            }
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 w-20 h-20 relative">
                          <Image
                            src={item.image || "/placeholder-food.jpg"}
                            alt={item.name}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-gray-900">
              Restaurant not found
            </h2>
            <p className="text-gray-600 mt-2">
              The restaurant you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Link href="/" legacyBehavior>
              <a className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-md">
                Back to home
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    await connectDB();

    const { id } = context.params as { id: string };

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/restaurants/${id}`,
    );

    return {
      props: {
        restaurant: JSON.parse(JSON.stringify(response.data.restaurant)),
      },
    };
  } catch (error) {
    console.error("Error fetching restaurant:", error);

    return {
      props: {
        restaurant: null,
        error: "Failed to load restaurant",
      },
    };
  }
};

export default RestaurantDetail;

