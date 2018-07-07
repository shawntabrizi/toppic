var redditCoreURL = 'https://www.reddit.com'

//This function uses a reddit API to search for subreddits using a keyword
async function getSubredditsByTopic(topic) {
    var topicURL = 'https://www.reddit.com/search.json?type=sr&q=' + encodeURI(topic);
    //console.log(topicURL)
    var response = await fetch(topicURL);
    var data = await response.json();

    var output = []

    for (child in data.data.children) {
        output.push(data.data.children[child].data)
    }

    //console.log(output)
    return output;
}

//Get the top posts for a subreddit, given a time filter
async function getTopPosts(subreddits, listing = 'top', time) {
    var subredditsUrls = subreddits.map(function (subreddit) {
        var redditURL = redditCoreURL + subreddit['url'] + listing + '.json'

        if (time) {
            redditURL += '?t=' + time
        }

        return redditURL
    });

    //get all posts in parellel
    var data = await Promise.all(
        subredditsUrls.map(
            url =>
                fetch(url).then(
                    (response) => response.json()
                )));

    //organize the posts into a single array
    var posts = []

    for (d in data) {
        posts = posts.concat(data[d]['data']['children'])
    }

    return posts
}

//Probably doesn't need to be its own function
function getInput() {
    var input = document.getElementById('input');
    var select = document.getElementById('select')
    return [input.value, select.value];
}

//Posts should be sorted since it is "top", but I may want to introduce new
function sortPosts(a, b) {
    let aScore = a['data']['score']
    let bScore = b['data']['score']
    return bScore - aScore
}

//empty the output box
function clearOutput() {
    var output = document.getElementById('output')
    output.innerHTML = ''

    return;
}

//create a key of subreddits used
function createSubredditKey(subreddits) {
    var keyArea = document.getElementById('key');

    keyArea.innerHTML = ''

    for (sub in subreddits) {
        let subreddit = subreddits[sub]
        let formCheck = document.createElement('div')
        formCheck.setAttribute('class', 'form-check')
        let formLabel = document.createElement('label')
        formLabel.setAttribute('class', 'form-check-label')
        let text = document.createTextNode(subreddit['display_name_prefixed'])
        let checkbox = document.createElement('input')
        checkbox.setAttribute('type', 'checkbox')
        checkbox.setAttribute('class', 'form-check-input')
        checkbox.value = subreddit['display_name']
        checkbox.checked = true;

        formLabel.appendChild(checkbox)
        formLabel.appendChild(text)
        formCheck.appendChild(formLabel)

        keyArea.appendChild(formCheck)
    }
}

//create the main table body and header
function createTable() {
    var output = document.getElementById('output');
    var rows = [].slice.call(output.getElementsByClassName('reddit-post'), 0);

    var table = document.createElement('table');
    table.id = 'main_table'
    table.setAttribute('class', 'table table-striped')

    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    var upvotes = document.createElement('th');
    upvotes.scope = 'col';
    upvotes.innerText = '#'

    var title = document.createElement('th');
    title.scope = 'col';
    title.innerText = 'Title'

    var subredditName = document.createElement('th');
    subredditName.scope = 'col';
    subredditName.innerText = 'Subreddit'

    tr.appendChild(upvotes)
    tr.appendChild(title)
    tr.appendChild(subredditName)

    thead.appendChild(tr)

    var tbody = document.createElement('tbody')
    tbody.id = 'tableBody'

    table.appendChild(thead);
    table.appendChild(tbody);

    output.appendChild(table)
}

//insert a table row into table body
function createRow(post) {

    var tbody = document.getElementById("tableBody")

    let title = post['data']['title'];
    let score = post['data']['score'];
    let link = redditCoreURL + post['data']['permalink'];
    let subredditName = post['data']['subreddit'];

    var tableRow = document.createElement('tr');
    tableRow.setAttribute('data-subreddit', subredditName);
    tableRow.setAttribute('class', 'reddit-post');

    var upvoteValue = document.createElement('td');
    upvoteValue.innerText = score;

    var titleValue = document.createElement('td');
    var aLink = document.createElement('a')
    aLink.href = link;
    aLink.target = '_blank';
    aLink.innerText = title;
    titleValue.appendChild(aLink);

    var subredditValue = document.createElement('td');
    subredditValue.innerText = subredditName;

    tableRow.appendChild(upvoteValue)
    tableRow.appendChild(titleValue)
    tableRow.appendChild(subredditValue)

    tbody.appendChild(tableRow);
}

//main function
async function showAllPostsForTopic() {
    clearOutput();

    var input = getInput();
    var topic = input[0]
    //we stick time information in the select value
    var listing = input[1].split("_")
    var subreddits = await getSubredditsByTopic(topic);

    createSubredditKey(subreddits);

    createTable();
    //if no time information
    if (listing.length == 1) {
        var posts = await getTopPosts(subreddits, listing[0])
    //if time information available
    } else if (listing.length == 2) {
        var posts = await getTopPosts(subreddits, listing[0], listing[1])
    }

    for (p in posts) {
        var post = posts[p]
        createRow(post);
    }

    $('#main_table').DataTable({
        //show all
        "pageLength": -1,
        //order by upvote count
        "order": [[0, "desc"]],
        "dom": '<"top"f>rt<"bottom"><br/><"clear">'
    });

    console.log("Done!")
}

//detect if key changes, and remove posts from that subreddit
document.querySelector('#key').addEventListener('change', function (event) {
    if (event.target.classList.contains('form-check-input')) {
        let value = event.target.value;

        let elements = document.querySelectorAll(`[data-subreddit="${value}"]`)

        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = elements[i].style.display === 'none' ? '' : 'none';
        }
    }
})