var redditCoreURL = 'https://www.reddit.com'

//This function uses a reddit API to tell me the subreddits for a particular topic
async function getSubredditsByTopic(topic) {
    var topicURL = 'https://www.reddit.com/api/subreddits_by_topic.json?query=' + encodeURI(topic);
    //console.log(topicURL)
    var response = await fetch(topicURL);
    var data = await response.json();

    //console.log(data)
    return data;
}

//Get the top posts for a subreddit, given a time filter
async function getTopPosts(subreddit, listing = 'top', time = 'week') {
    var query = '?t=' + time
    var redditURL = redditCoreURL + subreddit['path'] + listing + '.json' + query;
    console.log(redditURL)
    var response = await fetch(redditURL);
    var data = await response.json();
    //console.log(JSON.stringify(data['data']));

    return data['data']['children'];
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

function clearOutput() {
    var output = document.getElementById('output')
    output.innerHTML = ''

    return;
}

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
        checkbox.value = subreddit['name']
        checkbox.checked = true;

        formLabel.appendChild(checkbox)
        formLabel.appendChild(text)
        formCheck.appendChild(formLabel)

        keyArea.appendChild(formCheck)
    }
}

async function showAllPostsForTopic() {
    clearOutput();

    var input = getInput();
    var topic = input[0]
    var listing = input[1]
    var subreddits = await getSubredditsByTopic(topic);

    createSubredditKey(subreddits);

    var output = document.getElementById('output');
    var rows = [].slice.call(output.getElementsByClassName('reddit-post'), 0);

    var table = document.createElement('table');
    table.id = 'main_table'
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

    table.appendChild(thead);
    table.appendChild(tbody);

    output.appendChild(table)


    for (sub in subreddits) {
        var subreddit = subreddits[sub];
        var posts = await getTopPosts(subreddit, listing);
        posts.sort(sortPosts);


        
        var i = 0;
        var j = 0;
        //There is probably a better way to do this loop, but i dunno, its 5am.
        do {
            while (j < posts.length) {
                var post = posts[j];
                let title = post['data']['title'];
                let score = post['data']['score'];
                let link = redditCoreURL + post['data']['permalink']

                

                var tableRow = document.createElement('tr');
                tableRow.setAttribute('data-score', score)
                tableRow.setAttribute('data-subreddit', subreddit['name'])
                tableRow.setAttribute('class', 'reddit-post')

                var upvoteValue = document.createElement('td');
                upvoteValue.innerText = score;

                var titleValue = document.createElement('td');
                var aLink = document.createElement('a')
                aLink.href = link;
                aLink.target = '_blank';
                aLink.innerText = title;
                titleValue.appendChild(aLink);

                var subredditValue = document.createElement('td');
                subredditValue.innerText = subreddit['name'];

                

                tableRow.appendChild(upvoteValue)
                tableRow.appendChild(titleValue)
                tableRow.appendChild(subredditValue)

                

                //If there is a div element to check, and the score is larger than the div-score, add the new element above it
                if (rows[i] && score > rows[i].getAttribute('data-score')) {
                    tbody.insertBefore(tableRow, rows[i]);
                    j++;
                //Once the score is below the one we checked, if there is a next element to check, break the loop, and check the next element on the same posts[j]
                } else if (rows[i+1]) {
                    break;
                //Otherwise, add element to the end
                } else {
                    tbody.appendChild(tableRow);
                    j++;
                }
            }

            if (j == posts.length) {
                break;
            }

            i++;
            //console.log("loop: " + i + "," + j)
        } while (i < rows.length)
    }

    console.log("Done!")
}

document.querySelector('#key').addEventListener('change', function (event) {
    if (event.target.classList.contains('form-check-input')) {
        let value = event.target.value;
        
        let elements = document.querySelectorAll(`[data-subreddit="${value}"]`)
        
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = elements[i].style.display === 'none' ? '' : 'none';
        }
    }
})

$(document).ready(function () {
    $('#main_table').DataTable();
});