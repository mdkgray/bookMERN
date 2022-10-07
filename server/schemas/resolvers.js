const { AuthenticationError } = require("apollo-server-express");

const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-_v -password');
                
                return userData;
            }
            throw new AuthenticationError('No user found. Please sign up or login');
        },
    },

    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);

            return { token, user };
        },

        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect username or password. Please try again');
            }

            const correctPW = await user.isCorrectPassword(password);

            if (!correctPW) {
                throw new AuthenticationError('Incorrect username or password. Please try again');
            }

            const token = signToken(user);
            return { token, user };
        },

        saveBook: async (parent, { userId, bookData }, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                    { _id: userId },
                    { $addToSet: { savedBooks: { book: bookData }}},
                    { new: true, runValidators: true }
                );
            }
            throw new AuthenticationError('Must be logged in to save a book.');
        }, 

        removeBook: async (parent, { book }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: book }},
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Must be logged in to remove a book.');
        }
    }
};

module.exports = resolvers;