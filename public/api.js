export async function fetchData(route, method = 'GET', headers = {}, body = null, callback, error_callback = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(route, options);
        if(response.status === 403) {
            //window.location.href = '/login/login.html';
            console.log(response);
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        callback(data);
    } catch (err) {
        if (error_callback) {
            error_callback(err);
        } else {
            console.error('Error fetching data:', err);
        }
    }
}