## Flex Fits (Backend)

Flex Fits is a sample online store 🛍 . This is the GraphQL API for the application.

GraphQL Server ➡ [Hosted on Heroku](https://flex-fits-server.herokuapp.com)

> Create a user account with a real email (to receive email) and play around with the app.
>
> - Default admin **Account** 👉 _admin@flexfits.com_. **Password** 👉 _awesomeapp_.
>
> You can upgrade a normal user to an admin but cannot edit this default admin account

---

### Features ✨

✔ User Authentication (Signup and Signin)

✔ Authorization (permissions => User, Admin)

✔ Password Reset (Forget Password)

✔ Password validations

✔ Search (Items)

✔ Pagination (Items and Orders)

✔ Payment processing (cart checkout)

---

#### Users can

➖ Create account and log in

➖ Reset their password (password reset email)

➖ Upload items to the store

➖ Manage items they own (edit, delete)

➖ Search for items

➖ Add and remove items from their cart

➖ Checkout items in their cart

➖ View all their Orders

➖ View individual orders

➖ Manage their Account (Update name and password)

---

#### Admins can (in addition)

❇ Manage user permissions

❇ Manage all items

---

### Tech Stack

✅ Nodejs (GraphQL server with **GraphQL-Yoga**)

✅ **Prisma** for DB management

✅ **Stripe** API for payment processing

✅ **Sendgrid** For email sending

---

### Future improvements

If I'm to improve this app, here's how I would begin:

- Implement ability to rate items
- Implement filtering by sellers, ratings, etc on the Items page
- ...
