// Helper function for making API requests
async function apiRequest(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

// Product registration page
if (window.location.pathname.includes('register.html')) {
    const productForm = document.getElementById('product-form');
    const productList = document.getElementById('product-list');

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(productForm);
        try {
            await fetch('/products', {
                method: 'POST',
                body: formData
            });
            alert('Product added successfully!');
            productForm.reset();
            loadProducts();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add product');
        }
    });

    async function loadProducts() {
        try {
            const products = await apiRequest('/products');
            productList.innerHTML = '';
            products.forEach(product => {
                const li = document.createElement('li');
                li.textContent = product.title;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', async () => {
                    try {
                        await apiRequest(`/products/${product.id}`, 'DELETE');
                        li.remove();
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to delete product');
                    }
                });
                li.appendChild(deleteButton);
                productList.appendChild(li);
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load products');
        }
    }

    loadProducts();
}

// Product display page
if (window.location.pathname.includes('products.html')) {
    const productGrid = document.getElementById('product-grid');

    async function loadProducts() {
        try {
            const products = await apiRequest('/products');
            productGrid.innerHTML = '';
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${product.image_path}" alt="${product.title}">
                    <h3>${product.title}</h3>
                    <p>$${product.price.toFixed(2)}</p>
                    <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                `;
                productGrid.appendChild(card);
            });

            productGrid.addEventListener('click', async (e) => {
                if (e.target.classList.contains('add-to-cart')) {
                    const productId = e.target.getAttribute('data-id');
                    try {
                        await apiRequest('/cart', 'POST', { product_id: productId });
                        alert('Product added to cart!');
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to add product to cart');
                    }
                }
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load products');
        }
    }

    loadProducts();
}

// Shopping cart page
if (window.location.pathname.includes('cart.html')) {
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    const placeOrderButton = document.getElementById('place-order');

    async function loadCart() {
        try {
            const cartItems = await apiRequest('/cart');
            const products = await apiRequest('/products');
            cartList.innerHTML = '';
            let total = 0;

            cartItems.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${product.title}</span>
                        <span>$${product.price.toFixed(2)}</span>
                        <button class="decrease" data-id="${product.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase" data-id="${product.id}">+</button>
                        <button class="remove" data-id="${product.id}">Remove</button>
                    `;
                    cartList.appendChild(li);
                    total += product.price * item.quantity;
                }
            });

            cartTotal.textContent = `Total: $${total.toFixed(2)}`;
        } catch (error) {
            console.error(d cart');
        }
    }

    cartList.addEventListener('click', async (e) => {
        const productId = e.target.getAttribute('data-id');
        if (e.target.classList.contains('decrease')) {
            try {
                const cartItems = await apiRequest('/cart');
                const item = cartItems.find(i => i.product_id === parseInt(productId));
                if (item && item.quantity > 1) {
                    await apiRequest(`/cart/${productId}`, 'PUT', { quantity: item.quantity - 1 });
                } else {
                    await apiRequest(`/cart/${productId}`, 'DELETE');
                }
                loadCart();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to update cart');
            }
        } else if (e.target.classList.contains('increase')) {
            try {
                const cartItems = await apiRequest('/cart');
                const item = cartItems.find(i => i.product_id === parseInt(productId));
                await apiRequest(`/cart/${productId}`, 'PUT', { quantity: (item ? item.quantity : 0) + 1 });
                loadCart();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to update cart');
            }
        } else if (e.target.classList.contains('remove')) {
            try {
                await apiRequest(`/cart/${productId}`, 'DELETE');
                loadCart();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to remove item from cart');
            }
        }
    });

    placeOrderButton.addEventListener('click', () => {
        placeOrderButton.classList.add('flash-red');
        setTimeout(() => {
            placeOrderButton.style.display = 'none';
        }, 500);
    });

    loadCart();
}