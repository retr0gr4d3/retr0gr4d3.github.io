/*
 Copyright (C) Jake Hurd 2023
 Let's play fetch!
 Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

// githubCommitCount.js
(function() {
    // Define the plugin function
    window.githubCommitCount = function(username, repository, branch, elementId) {
        const apiUrl = `https://api.github.com/repos/${username}/${repository}/commits?sha=${branch}&per_page=1`;

        // Fetch commit data from GitHub API
        fetch(apiUrl)
            .then(response => {
                const linkHeader = response.headers.get('Link');
                const commitCount = linkHeader ? parseInt(linkHeader.match(/page=(\d+)>; rel="last"/)[1]) : 0;

                const commitCountElement = document.getElementById(elementId);
                commitCountElement.textContent = `${commitCount}`;
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                const commitCountElement = document.getElementById(elementId);
                commitCountElement.textContent = 'Error fetching commit count';
            });
    };
})();