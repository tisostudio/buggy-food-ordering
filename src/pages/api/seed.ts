import type { NextApiRequest, NextApiResponse } from "next";
import { faker } from "@faker-js/faker";
import connectDB from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";

const isProduction = process.env.NODE_ENV === "production";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (isProduction) {
    return res
      .status(403)
      .json({ message: "Seeding is not allowed in production" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const seedCount = parseInt(req.query.count as string) || 20;

    const shouldClear = req.query.clear === "true";
    if (shouldClear) {
      await Restaurant.deleteMany({});
      await User.deleteMany({});
    }

    const restaurants = await seedRestaurants(seedCount);

    const users = await seedUsers(5);

    return res.status(200).json({
      message: "Database seeded successfully",
      restaurantsCreated: restaurants.length,
      usersCreated: users.length,
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return res.status(500).json({ message: "Error seeding database" });
  }
}

async function seedRestaurants(count: number) {
  const cuisines = [
    "Italian",
    "Mexican",
    "Chinese",
    "Japanese",
    "Indian",
    "American",
    "Thai",
    "Mediterranean",
    "Greek",
    "French",
    "Spanish",
    "Korean",
    "Vietnamese",
  ];

  const restaurantsToCreate = Array(count)
    .fill(0)
    .map(() => {
      const restaurantCuisines = faker.helpers.arrayElements(
        cuisines,
        faker.number.int({ min: 1, max: 3 })
      );

      const menuItemsCount = faker.number.int({ min: 6, max: 15 });
      const menuItems = Array(menuItemsCount)
        .fill(0)
        .map(() => {
          const price = faker.number.float({
            min: 5,
            max: 30,
            fractionDigits: 2,
          });

          return {
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price,
            image: `https://picsum.photos/200?_t=${Date.now()}_${faker.string.alphanumeric(
              6
            )}`,
            category: faker.helpers.arrayElement([
              "Appetizers",
              "Main Course",
              "Desserts",
              "Drinks",
              "Sides",
              "Specials",
            ]),
            popular: faker.datatype.boolean({ probability: 0.2 }),
            available: faker.datatype.boolean({ probability: 0.9 }),
            allergens: faker.helpers.arrayElements(
              ["Dairy", "Nuts", "Gluten", "Soy", "Shellfish"],
              faker.number.int({ min: 0, max: 3 })
            ),
          };
        });

      const isNightRestaurant = faker.datatype.boolean({ probability: 0.2 });

      let openHour, closeHour;

      if (isNightRestaurant) {
        openHour = faker.number.int({ min: 17, max: 20 });
        closeHour = faker.number.int({ min: 2, max: 6 });
      } else {
        openHour = faker.number.int({ min: 7, max: 11 });
        closeHour = faker.number.int({ min: 19, max: 23 });
      }

      const formattedOpenHour = openHour.toString().padStart(2, "0") + ":00";
      const formattedCloseHour = closeHour.toString().padStart(2, "0") + ":00";

      const daysOpen = Array.from({ length: 7 }, (_, i) => i).filter(() =>
        faker.datatype.boolean({ probability: 0.9 })
      );

      return {
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
        },
        cuisine: restaurantCuisines,
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        deliveryTime: faker.number.int({ min: 15, max: 60 }),
        deliveryFee: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
        minOrderAmount: faker.number.float({
          min: 10,
          max: 25,
          fractionDigits: 2,
        }),
        menu: menuItems,
        openingHours: {
          open: formattedOpenHour,
          close: formattedCloseHour,
          daysOpen: daysOpen.length > 0 ? daysOpen : [0, 1, 2, 3, 4, 5, 6],
        },
        isNightRestaurant: isNightRestaurant,
        image: `https://picsum.photos/200?_t=${Date.now()}_${faker.string.alphanumeric(
          6
        )}`,
        featured: faker.datatype.boolean({ probability: 0.3 }),
        manuallyClosed: faker.datatype.boolean({ probability: 0.2 }),
      };
    });

  return await Restaurant.insertMany(restaurantsToCreate);
}

async function seedUsers(count: number) {
  const usersToCreate = Array(count)
    .fill(0)
    .map(() => {
      const addressesCount = faker.number.int({ min: 1, max: 3 });
      const addresses = Array(addressesCount)
        .fill(0)
        .map((_, index) => ({
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          isDefault: index === 0,
        }));

      return {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),

        password: faker.internet.password({ length: 12 }),
        addresses,
        phoneNumber: faker.phone.number(),
      };
    });

  return await User.insertMany(usersToCreate);
}
