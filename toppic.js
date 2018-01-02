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

    for (sub in subreddits) {
        var subreddit = subreddits[sub];
        var posts = await getTopPosts(subreddit, listing);
        posts.sort(sortPosts);


        var output = document.getElementById('output');
        var divs = [].slice.call(output.getElementsByClassName('reddit-post'), 0);

        var i = 0;
        var j = 0;
        //There is probably a better way to do this loop, but i dunno, its 5am.
        do {
            while (j < posts.length) {
                var post = posts[j];
                let title = post['data']['title'];
                let score = post['data']['score'];
                let link = redditCoreURL + post['data']['permalink']

                var postOutput = document.createElement('div');
                postOutput.setAttribute('data-score', score)
                postOutput.setAttribute('data-subreddit', subreddit['name'])
                postOutput.setAttribute('class', 'reddit-post')
                var aLink = document.createElement('a')
                aLink.href = link;
                aLink.target = '_blank';
                aLink.innerText = `[${score}] ${title} (${subreddit['name']})`;

                postOutput.appendChild(aLink)

                //If there is a div element to check, and the score is larger than the div-score, add the new element above it
                if (divs[i] && score > divs[i].getAttribute('data-score')) {
                    output.insertBefore(postOutput, divs[i]);
                    j++;
                //Once the score is below the one we checked, if there is a next element to check, break the loop, and check the next element on the same posts[j]
                } else if (divs[i+1]) {
                    break;
                //Otherwise, add element to the end
                } else {
                    output.appendChild(postOutput);
                    j++;
                }
            }

            if (j == posts.length) {
                break;
            }

            i++;
            //console.log("loop: " + i + "," + j)
        } while (i < divs.length)
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