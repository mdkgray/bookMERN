const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        // query for me 
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
        // mutation to add a user 
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        // mutation to log in 
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

        //mutation to save a book 
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: bookData } },
                    { new: true }
                );
        
                return updatedUser;
            }
            throw new AuthenticationError('Must be logged in to save a book.');
        }, 

        // mutation to delete a book
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } }},
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Must be logged in to remove a book.');
        }
    }
};

module.exports = resolvers;