# Texting-Help

This is the repo that contains the Texting-Help API and Texting-Help Web App

## Structure

This repository contains the Texting-Help API under the api directory, and the Texting-Help Web App in the app directory
Please visit those folders for more information about them.

## Backlog

DONE
1) Hide "My Questions" when no user is logged in and add "showing questions... 1 - 10 of total questions"

DONE
2) Users page... Hide sections for FB Users

DONE
3) Asking a question... It fails for POST request getting cancelled... Add some sort of try/catch

DONE
4) Searching through questions

DONE
5) User input next line symbols

DONE
6) Add legit Facebook log in and log out buttons

DONE
7) Add app wide loading modal in index.html... use jQuery to show and hide it in each view

DONE
8) Enable click on the profile picture in the header for FB users to hit user page

DONE
9) Error handling for search... When no questions come back

DONE
10) Edit of questions

DONE
11) Edit of answers

DONE
12) Handle empty comments, answers, and posts

DONE
14) Add a last updated time if created time and updated time aren't equal

DONE
13) FB log in log out set round edges

DONE
14) Error handling... Replace all alerts with error page or modal or something...
  a) User creation and update
  b) Ask question
  c) When user token is stale... Log out

DONE
15) Notification system

DONE
16) Growler messages (http://bootstrap-notify.remabledesigns.com/) (http://goodybag.github.io/bootstrap-notify/)

DONE
17) Truncate length of description and title in quesions page

DONE
18) Reroute home page to questions page

DONE
19) Change favicon

DONE
20) Overhaul DB schema and API and UI
O  - Models
O    - vote = vote_on_answer + vote_on_post
O      - Add associations
O    - point = point_on_answer + point_on_post + point_on_comment_on_post + point_on_comment_on_answer
O      - Add associations
O    - comment = comment_on_answer + comment_on_post
O      - Add associations
O    - post
O      - Add associations
O  - Controllers
O    - post
O      - GET posts (get posts, get comments, get votes)
O      - GET 1 post (get post, get comments on post, get answers, get comments on answers)
O      - POST post (Fix up point)
O      - PUT post
O    - answer
O      - POST answer (Fix up point and notification)
O        - Point_On_Post for original post user
O        - Point_On_Answer for person answering
O        - Notification for original post user
O      - Update answer
O    - vote
O      - GET votes
O        - Split Vote into Vote_On_Answer + Vote_On_Post
O      - POST vote
O        - Split Vote into Vote_On_Answer + Vote_On_Post
O        - Fix up point
O        - Fix up notifications
O      - DELETE vote
O        - Split Vote into Vote_On_Answer + Vote_On_Post
O        - Fix up point
O    - comment
O      - GET comment
O        - Split Comment into Comment_On_Answer + Comment_On_Post
O      - POST comment
O        - Split Comment into Comment_On_Answer + Comment_On_Post
O        - Fix up point
O        - Fix up notifications
O    - point
O      - GET point
O        - Split Point into Point_On_Answer + Point_On_Post

    - UI
O      - See Question
O      - See Questions
O      - Filtering by only me

O      - Ask question
O      - Edit a question
O      - Add comment
O      - Add answer
O      - Edit answer
O      - Add user
O      - Edit user
O      - Upvote question
O      - Downvote question

DONE 21) Add filter for time
O  - Today
O  - This week
O  - This month

DEFERRED 22) Add filter to rank
  - Top voted
  - Top commented



23) Search with space

24) Update footer

25) Ask a question.. Success should take you to the question and not ask another question

26) Post your answer and post your comment... add some padding between textarea and button