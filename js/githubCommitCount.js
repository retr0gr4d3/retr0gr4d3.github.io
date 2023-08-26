/*
 Copyright (C) Jake Hurd 2023
 Let's play fetch!
 Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

// githubCommitCount.js

(function() {
    // Define the plugin function
    window.githubCommitCount = function(username, repository, branch, elementId) {
        const repoInfoUrl = `https://api.github.com/repos/${username}/${repository}`;
        const commitUrl = `https://api.github.com/repos/${username}/${repository}/commits?sha=${branch}&per_page=1`;

        // Fetch repository info from GitHub API
        fetch(repoInfoUrl)
            .then(response => response.json())
            .then(repoInfo => {
                const lastUpdated = new Date(repoInfo.pushed_at).toLocaleString();

                // Fetch commit data from GitHub API
                fetch(commitUrl)
                    .then(response => {
                        const linkHeader = response.headers.get('Link');
                        const commitCount = linkHeader ? parseInt(linkHeader.match(/page=(\d+)>; rel="last"/)[1]) : 0;

                        const commitCountElement = document.getElementById(elementId);
                        commitCountElement.innerHTML = `r-${commitCount} | Last Updated: ${lastUpdated}`;
                    })
                    .catch(error => {
                        console.error('Error fetching commit data:', error);
                        const commitCountElement = document.getElementById(elementId);
                        commitCountElement.textContent = 'Error fetching commit data';
                    });
            })
            .catch(error => {
                console.error('Error fetching repository info:', error);
                const commitCountElement = document.getElementById(elementId);
                commitCountElement.textContent = 'Error fetching repository info';
            });
    };
})();

/*
This updated code fetches both the "updated_at" and the commit count information from the GitHub repository using separate API calls.

The lastUpdated variable stores the formatted date and time of the last update, which is then displayed alongside the commit count in the HTML element.
*/