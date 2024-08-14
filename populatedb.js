/* eslint camelcase: 0 */

const userArgs = process.argv.slice(2);

const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');

const users = [];
const posts = [];
const comments = [];

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
    console.log('Debug: About to connect');
    await mongoose.connect(mongoDB);
    console.log('Debug: Should be connected?');

    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

    await createUsers();
    await createPosts();
    await createComments();

    console.log('Debug: Closing mongoose');
    mongoose.connection.close();
}

async function createUser(
    index,
    name,
    email,
    password,
    is_admin = false,
    is_banned = false,
    image
) {
    const userDetail = {
        name,
        email,
        password,
        is_admin,
        is_banned
    };
    if (image) {
        userDetail.image = image;
    }

    const user = new User(userDetail);
    await user.save();
    users[index] = user;
}

async function createPost(
    index,
    author,
    title,
    summary,
    text,
    is_published = false,
    image
) {
    const postDetail = { title, author, summary, text, is_published };
    if (image) {
        postDetail.image = image;
    }

    const post = new Post(postDetail);
    await post.save();
    posts[index] = post;
}

async function createComment(index, text, user, post, parent_comment = null) {
    const commentDetail = { text, user, post, parent_comment };

    const comment = new Comment(commentDetail);
    await comment.save();

    post.comment_count++;
    await post.save();

    if (parent_comment) {
        parent_comment.comments.push(comment);
        await parent_comment.save();
    }

    comments[index] = comment;
}

async function createUsers() {
    console.log('adding users');
    await createUser(
        0,
        'Mike stevens',
        'mikestevens@mail.com',
        'mikepassword',
        false,
        true
    );
    await createUser(1, 'June johnson', 'junejohnson@mail.com', 'junepassword');
    await createUser(2, "Leah o'brien", 'leahobrien@mail.com', 'leahpassword');
    await createUser(3, 'Carl smith', 'carlsm1992@mail.com', 'carlpassword');
    await createUser(4, 'Thom.', 'thom@mail.com', 'thompassword');
    await createUser(
        5,
        'Gabriel miranda',
        'gabyam@mail.com',
        'gabypassword',
        true,
        false
    );
}

async function createPosts() {
    console.log('adding posts');
    for (let i = 0; i < 20; i++) {
        await createPost(
            i,
            users[5],
            'Pagination test number ' + (i + 1),
            'This is just a sample post to test the pagination feature',
            '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>'
        );
    }
    await createPost(
        20,
        users[5],
        'How i made this blog',
        'this blog app took me months, i can explain it...',
        '<p>This is only a sample content that i should fill later</p>'
    );
    await createPost(
        21,
        users[5],
        'Cool music albums',
        'Some images of cool music albums, just to test images',
        '<p>This is only a sample content that i should fill later</p>'
    );
    await createPost(
        22,
        users[5],
        'Nothing to read here',
        "Don't really have much to say, i want to finish this already.",
        '<p>This is only a sample content that i should fill later</p>'
    );
}

async function createComments() {
    console.log('adding comments');
    await createComment(0, 'Horrible music taste!!!', users[0], posts[21]);
    await createComment(1, 'sorry!', users[5], posts[20]);
    await createComment(
        2,
        "This is the best post i've ever read",
        users[1],
        posts[22]
    );
    await createComment(
        3,
        'What? this post is empty!',
        users[2],
        posts[22],
        comments[2]
    );
    await createComment(4, 'Exactly.', users[1], posts[22], comments[3]);
    await createComment(5, 'It sucks!! #%&@$', users[0], posts[20]);
    await createComment(
        6,
        'Btw, nested comments were hard to implement!',
        users[5],
        posts[20],
        comments[1]
    );
    await createComment(
        7,
        'At first, i was returning the comments already nested from the api',
        users[5],
        posts[20],
        comments[6]
    );
    await createComment(
        8,
        'But that approach is problematic when you want to paginate the comments and its replies',
        users[5],
        posts[20],
        comments[7]
    );
    await createComment(
        9,
        'So i decided to first fetch the post top level comments and then fetch the replies of each comment',
        users[5],
        posts[20],
        comments[8]
    );
}
