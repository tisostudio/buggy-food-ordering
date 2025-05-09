import { useCartStore } from "@/store/cartStore";
import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";

const CartPage: NextPage = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();
  const router = useRouter();

  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [calculatedSubtotal, setCalculatedSubtotal] = useState(0);

  useEffect(() => {
    const subtotal = parseFloat(getTotalPrice().toFixed(2));
    const total = parseFloat((subtotal + 5).toFixed(2));

    setCalculatedSubtotal(subtotal);
    setCalculatedTotal(total);
  }, [items, getTotalPrice]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  const proceedToCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    router.push("/checkout");
  };

  return (
    <>
      <Head>
        <title>Your Cart | Food Delivery</title>
      </Head>
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven&apos;t added anything to your cart yet.
              </p>
              <Link href="/" legacyBehavior>
                <a className="inline-block bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 transition">
                  Browse Restaurants
                </a>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={item.id} className="p-6">
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 mb-4 sm:mb-0">
                            <Image
                              src={
                                item.menuItem.image || "/placeholder-food.jpg"
                              }
                              alt={item.menuItem.name}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md"
                            />
                          </div>
                          <div className="flex-1 sm:ml-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {item.menuItem.name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {item.menuItem.description}
                                </p>
                              </div>
                              <div className="mt-4 sm:mt-0">
                                <p className="text-lg font-medium text-gray-900">
                                  $
                                  {(
                                    item.menuItem.price * item.quantity
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  className={`px-3 py-1 ${item.quantity > 1 ?"text-gray-600 hover:bg-gray-100":"text-gray-300"} " `}
                                  aria-label="Decrease quantity"
                                  disabled={item.quantity <= 1 }
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 text-gray-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                                aria-label="Remove item"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">
                    Order Summary
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ${calculatedSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="text-gray-900">$5.00</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between font-medium">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        ${calculatedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    className="mt-6 w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => clearCart()}
                    className="mt-4 w-full bg-white text-red-600 border border-red-600 py-3 px-4 rounded-md hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    Clear Cart
                  </button>
                  <Link href="/cart" legacyBehavior>
                    <a className="mt-4 block text-center text-sm text-red-600 hover:text-red-800">
                      Return to Cart
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
