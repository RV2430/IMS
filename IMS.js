import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setLogLevel } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDJw4FMtiaw5F8Kh4_4uyWLMf2-h-JAwYo",
  authDomain: "inventory-management-2435e.firebaseapp.com",
  projectId: "inventory-management-2435e",
  storageBucket: "inventory-management-2435e.firebasestorage.app",
  messagingSenderId: "240440583248",
  appId: "1:240440583248:web:1567c0bbb7ceebb7375d55"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const stockCollection = collection(db, `artifacts/${appId}/public/data/stock`);
const usedStockCollection = collection(db, `artifacts/${appId}/public/data/usedStock`);
const vendorsCollection = collection(db, `artifacts/${appId}/public/data/vendors`);
const activityLogCollection = collection(db, `artifacts/${appId}/public/data/activityLog`);
setLogLevel('debug');

// Global data arrays for real-time updates
let allStockData = [];
let allUsedData = [];
let allVendorsData = [];

// UI Elements
const loginPage = document.getElementById('login-page');
const mainApp = document.getElementById('main-app');
const authTitle = document.getElementById('auth-title');
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const anonymousLoginButton = document.getElementById('anonymous-login-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const loginErrorEl = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');
const userDisplay = document.getElementById('user-display');
const switchToSignupButton = document.getElementById('switch-to-signup');
const switchToLoginButton = document.getElementById('switch-to-login');

// Display Name Modal
const displayNameModal = document.getElementById('display-name-modal');
const displayNameForm = document.getElementById('display-name-form');
const displayNameInput = document.getElementById('display-name-input');

// Edit Modals
const editStockModal = document.getElementById('edit-stock-modal');
const editStockForm = document.getElementById('edit-stock-form');
const editStockCancelBtn = document.getElementById('edit-stock-cancel');
const editVendorModal = document.getElementById('edit-vendor-modal');
const editVendorForm = document.getElementById('edit-vendor-form');
const editVendorCancelBtn = document.getElementById('edit-vendor-cancel');

// Page Navigation
const pages = document.querySelectorAll(".page-content");
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

// Event delegation for all nav links
document.body.addEventListener("click", e => {
    const link = e.target.closest(".nav-link");
    if (link) {
        e.preventDefault();
        const pageId = link.dataset.page;
        showPage(pageId);
        if (pageId === "stock-details-page") applyFiltersAndSort();
        if (pageId === "dashboard-page") updateDashboard(allStockData);
        if (pageId === "use-stock-page") loadStockOptions();
        if (pageId === "used-stock-page") updateUsedStock(allUsedData);
    }
});

function showPage(pageId){
    pages.forEach(p=>p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
    // Update active state for both main nav and mobile nav
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.dataset.page === pageId) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

mobileMenuButton.addEventListener("click", ()=>{
    mobileMenu.classList.toggle("hidden");
});

// Confirmation Modal Logic
const confirmationModal = document.getElementById('confirmation-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalConfirmBtn = document.getElementById('modal-confirm');
const modalCancelBtn = document.getElementById('modal-cancel');

function showConfirmationModal(message, onConfirm) {
    modalMessage.textContent = message;
    confirmationModal.classList.remove('hidden');

    const confirmHandler = () => {
        onConfirm();
        hideConfirmationModal();
        modalConfirmBtn.removeEventListener('click', confirmHandler);
    };

    const cancelHandler = () => {
        hideConfirmationModal();
        modalConfirmBtn.removeEventListener('click', confirmHandler);
    };

    modalConfirmBtn.addEventListener('click', confirmHandler);
    modalCancelBtn.addEventListener('click', cancelHandler);
}

function hideConfirmationModal() {
    confirmationModal.classList.add('hidden');
}

// --- Authentication Logic ---
switchToSignupButton.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
    authTitle.textContent = "Sign up for IMS";
    loginErrorEl.textContent = "";
});

switchToLoginButton.addEventListener('click', () => {
    loginSection.classList.remove('hidden');
    signupSection.classList.add('hidden');
    authTitle.textContent = "Log in to IMS";
    loginErrorEl.textContent = "";
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginErrorEl.textContent = "Failed to log in: " + error.message;
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginErrorEl.textContent = "Failed to sign up: " + error.message;
    }
});

anonymousLoginButton.addEventListener('click', async () => {
    try {
        await signInAnonymously(auth);
    } catch (error) {
        loginErrorEl.textContent = "Failed to sign in anonymously: " + error.message;
    }
});

displayNameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = displayNameInput.value;
    const user = auth.currentUser;
    if (user && name) {
        await updateProfile(user, { displayName: name });
        displayNameModal.classList.add('hidden');
        userDisplay.textContent = `Welcome, ${name}!`;
    }
});

logoutButton.addEventListener('click', async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPage.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // Show display name prompt for new users
        if (!user.displayName) {
             displayNameModal.classList.remove('hidden');
        } else {
            userDisplay.textContent = `Welcome, ${user.displayName}!`;
        }

        // --- Real-time data listeners initialized here ---
        onSnapshot(stockCollection, (snapshot) => {
            allStockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Stock data updated:", allStockData);
            updateDashboard(allStockData);
            applyFiltersAndSort();
            loadStockOptions();
            populateFilterOptions();
        });

        onSnapshot(usedStockCollection, (snapshot) => {
            allUsedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Used stock data updated:", allUsedData);
            updateUsedStock(allUsedData);
        });

        onSnapshot(vendorsCollection, (snapshot) => {
            allVendorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Vendors data updated:", allVendorsData);
            populateVendorSelect();
            renderVendorsTable(allVendorsData);
            populateFilterOptions();
        });

        onSnapshot(activityLogCollection, (snapshot) => {
            const recentActivity = snapshot.docs
                .map(doc => doc.data())
                .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
                .slice(0, 5);
            updateActivityFeed(recentActivity);
        });
        
        showPage('home-page');
    } else {
        loginPage.classList.remove('hidden');
        mainApp.classList.add('hidden');
        showPage('login-page');
    }
});

// Activity Log Function
async function logActivity(action, details) {
    if (auth.currentUser) {
        const userName = auth.currentUser.displayName || auth.currentUser.email || "Anonymous";
        await addDoc(activityLogCollection, {
            action,
            details,
            user: userName,
            timestamp: new Date()
        });
    }
}

// Vendor Management Logic
const addVendorForm = document.getElementById("add-vendor-form");
const vendorsTableBody = document.querySelector("#vendorsTable tbody");
const itemVendorSelect = document.getElementById("itemVendor");

addVendorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const vendorName = document.getElementById("vendorName").value;
    const contactPerson = document.getElementById("contactPerson").value;
    const contactEmail = document.getElementById("contactEmail").value;

    if (!vendorName) {
        loginErrorEl.textContent = "Vendor name is required.";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
        return;
    }

    await addDoc(vendorsCollection, {
        name: vendorName,
        contactPerson: contactPerson,
        contactEmail: contactEmail,
        createdAt: new Date()
    });
    loginErrorEl.textContent = `Vendor "${vendorName}" added successfully! ✅`;
    setTimeout(() => loginErrorEl.textContent = "", 3000);
    addVendorForm.reset();
    await logActivity("Added", `New vendor: ${vendorName}`);
});

function renderVendorsTable(data) {
    vendorsTableBody.innerHTML = "";
    data.forEach(vendor => {
        vendorsTableBody.innerHTML += `<tr>
            <td class="px-6 py-4">${vendor.name}</td>
            <td class="px-6 py-4">${vendor.contactPerson || 'N/A'}</td>
            <td class="px-6 py-4">${vendor.contactEmail || 'N/A'}</td>
            <td class="px-6 py-4 flex justify-end space-x-2">
                <button class="px-4 py-2 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-700 transition-colors" onclick="openEditVendorModal('${vendor.id}')">Edit</button>
                <button class="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors" onclick="deleteVendor('${vendor.id}')">Delete</button>
            </td>
        </tr>`;
    });
}

window.deleteVendor = async id => {
    showConfirmationModal("Are you sure you want to delete this vendor? This will not remove the vendor from existing stock items.", async () => {
        const vendorData = allVendorsData.find(v => v.id === id);
        await deleteDoc(doc(vendorsCollection, id));
        await logActivity("Deleted", `Deleted vendor: ${vendorData.name}`);
    });
}

function populateVendorSelect() {
    const selects = [document.getElementById("itemVendor"), document.getElementById("edit-itemVendor")];
    selects.forEach(select => {
        const currentSelected = select.value;
        select.innerHTML = `<option value="">-- No Vendor --</option>`;
        allVendorsData.forEach(vendor => {
            const option = document.createElement("option");
            option.value = vendor.id;
            option.textContent = vendor.name;
            select.appendChild(option);
        });
        select.value = currentSelected;
    });
}

// Edit Vendor Modal
window.openEditVendorModal = (id) => {
    const vendor = allVendorsData.find(v => v.id === id);
    if (vendor) {
        document.getElementById('edit-vendor-id').value = vendor.id;
        document.getElementById('edit-vendorName').value = vendor.name;
        document.getElementById('edit-contactPerson').value = vendor.contactPerson || '';
        document.getElementById('edit-contactEmail').value = vendor.contactEmail || '';
        editVendorModal.classList.remove('hidden');
    }
}
editVendorCancelBtn.addEventListener('click', () => editVendorModal.classList.add('hidden'));
editVendorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-vendor-id').value;
    const name = document.getElementById('edit-vendorName').value;
    const contactPerson = document.getElementById('edit-contactPerson').value;
    const contactEmail = document.getElementById('edit-contactEmail').value;

    await updateDoc(doc(vendorsCollection, id), {
        name,
        contactPerson,
        contactEmail
    });
    loginErrorEl.textContent = `Vendor updated successfully! ✅`;
    setTimeout(() => loginErrorEl.textContent = "", 3000);
    editVendorModal.classList.add('hidden');
    await logActivity("Updated", `Updated vendor: ${name}`);
});

// Stock Form
const stockForm = document.getElementById("stockForm");
stockForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const name = document.getElementById("itemName").value;
    const category = document.getElementById("itemCategory").value;
    const type = document.getElementById("itemType").value;
    const vendorSelect = document.getElementById("itemVendor");
    const vendorId = vendorSelect.value;
    const vendorName = vendorSelect.options[vendorSelect.selectedIndex].text;
    const quantity = parseInt(document.getElementById("itemQuantity").value);
    const unit = document.getElementById("itemUnit").value;
    const price = parseFloat(document.getElementById("itemPrice").value);
    const minStock = parseInt(document.getElementById("itemMinStock").value);

    // Basic validation
    if (quantity < 0 || price < 0 || minStock < 0) {
        loginErrorEl.textContent = "Quantity, price, and min stock cannot be negative.";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
        return;
    }

    await addDoc(stockCollection, {
        name, category, type, quantity, actualQuantity: quantity, unit, price, minStock, createdBy: auth.currentUser.displayName, createdAt: new Date(),
        vendorId: vendorId || null,
        vendorName: vendorId ? vendorName : null
    });
    loginErrorEl.textContent = "Item added! ✅";
    setTimeout(() => loginErrorEl.textContent = "", 3000);
    stockForm.reset();
    await logActivity("Added", `Added ${quantity} of ${name}`);
});

// Quick Add Buttons
const quickAddButtonsContainer = document.getElementById('quick-add-buttons');
const createQuickAddBtn = document.getElementById('create-quick-add-btn');

function createQuickAddButton(itemName, itemQuantity, itemPrice, itemUnit) {
    const button = document.createElement('button');
    button.className = 'quick-add-btn w-full px-6 py-3 bg-sky-50 text-sky-600 rounded-xl font-medium shadow-sm hover:bg-sky-100 transition-colors';
    button.dataset.itemName = itemName;
    button.dataset.itemCategory = 'Misc'; // Default category
    button.dataset.itemType = 'New'; // Default type
    button.dataset.itemQuantity = itemQuantity;
    button.dataset.itemPrice = itemPrice;
    button.dataset.itemMinStock = 0; // Default min stock
    button.dataset.itemUnit = itemUnit || 'pcs';
    button.dataset.itemVendorId = '';
    button.textContent = `Add ${itemQuantity} ${itemName}`;
    quickAddButtonsContainer.appendChild(button);
    // Re-attach event listeners to all quick-add-btns
    attachQuickAddListeners();
}

function attachQuickAddListeners() {
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.onclick = async () => {
            const name = btn.dataset.itemName;
            const category = btn.dataset.itemCategory;
            const type = btn.dataset.itemType;
            const quantity = parseInt(btn.dataset.itemQuantity);
            const price = parseFloat(btn.dataset.itemPrice);
            const minStock = parseInt(btn.dataset.itemMinStock);
            const unit = btn.dataset.itemUnit;
            const vendorId = btn.dataset.itemVendorId || null;
            const vendorName = vendorId ? allVendorsData.find(v => v.id === vendorId)?.name : null;
    
            await addDoc(stockCollection, {
                name, category, type, quantity, actualQuantity: quantity, unit, price, minStock, createdBy: auth.currentUser.displayName, createdAt: new Date(),
                vendorId, vendorName
            });
            loginErrorEl.textContent = `Successfully added ${quantity} of ${name}!`;
            setTimeout(() => loginErrorEl.textContent = "", 3000);
            await logActivity("Added", `Quick-added ${quantity} of ${name}`);
        };
    });
}
attachQuickAddListeners();

createQuickAddBtn.addEventListener('click', () => {
    const itemName = prompt("Enter the item name:");
    const itemQuantity = prompt("Enter the quantity:");
    const itemPrice = prompt("Enter the price per unit:");
    const itemUnit = prompt("Enter the unit (e.g., pcs, kg, m):") || 'pcs';

    if (itemName && !isNaN(parseInt(itemQuantity)) && !isNaN(parseFloat(itemPrice))) {
        createQuickAddButton(itemName, parseInt(itemQuantity), parseFloat(itemPrice), itemUnit);
    } else {
        loginErrorEl.textContent = "Invalid input. Please enter a valid name, quantity, and price.";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
    }
});

// Edit Stock Modal
window.openEditStockModal = (id) => {
    const item = allStockData.find(s => s.id === id);
    if (item) {
        document.getElementById('edit-stock-id').value = item.id;
        document.getElementById('edit-itemName').value = item.name;
        document.getElementById('edit-itemCategory').value = item.category || '';
        document.getElementById('edit-itemType').value = item.type;
        document.getElementById('edit-itemQuantity').value = item.quantity;
        document.getElementById('edit-itemUnit').value = item.unit || 'pcs';
        document.getElementById('edit-itemPrice').value = item.price;
        document.getElementById('edit-itemMinStock').value = item.minStock;
        document.getElementById('edit-itemVendor').value = item.vendorId || '';
        editStockModal.classList.remove('hidden');
    }
}
editStockCancelBtn.addEventListener('click', () => editStockModal.classList.add('hidden'));
editStockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-stock-id').value;
    const name = document.getElementById('edit-itemName').value;
    const category = document.getElementById('edit-itemCategory').value;
    const type = document.getElementById('edit-itemType').value;
    const quantity = parseInt(document.getElementById('edit-itemQuantity').value);
    const unit = document.getElementById('edit-itemUnit').value;
    const price = parseFloat(document.getElementById('edit-itemPrice').value);
    const minStock = parseInt(document.getElementById('edit-itemMinStock').value);
    const vendorSelect = document.getElementById("edit-itemVendor");
    const vendorId = vendorSelect.value;
    const vendorName = vendorSelect.options[vendorSelect.selectedIndex].text;

    if (quantity < 0 || price < 0 || minStock < 0) {
        loginErrorEl.textContent = "Quantity, price, and min stock cannot be negative.";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
        return;
    }

    await updateDoc(doc(stockCollection, id), {
        name, category, type, quantity, unit, price, minStock,
        vendorId: vendorId || null,
        vendorName: vendorId ? vendorName : null
    });
    loginErrorEl.textContent = `Item updated successfully! ✅`;
    setTimeout(() => loginErrorEl.textContent = "", 3000);
    editStockModal.classList.add('hidden');
    await logActivity("Updated", `Updated item: ${name}`);
});

// Load Stock Details
function displayStockData(data) {
    const tableBody = document.querySelector("#stockTable tbody");
    tableBody.innerHTML = "";
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="11" class="px-6 py-4 text-center text-gray-500">No items found.</td></tr>`;
        return;
    }
    data.forEach(d => {
        const isLowStock = d.quantity <= d.minStock;
        tableBody.innerHTML += `<tr>
            <td class="px-6 py-4">${d.name}</td>
            <td class="px-6 py-4">${d.category || ''}</td>
            <td class="px-6 py-4">${d.type}</td>
            <td class="px-6 py-4">${d.actualQuantity || d.quantity}</td>
            <td class="px-6 py-4 ${isLowStock ? 'text-red-600 font-semibold' : ''}">${d.quantity}</td>
            <td class="px-6 py-4">${d.unit || ''}</td>
            <td class="px-6 py-4">${d.minStock}</td>
            <td class="px-6 py-4">$${d.price}</td>
            <td class="px-6 py-4">${d.vendorName || 'N/A'}</td>
            <td class="px-6 py-4">${d.createdBy || 'Unknown'}</td>
            <td class="px-6 py-4 flex justify-end space-x-2">
                <button class="px-4 py-2 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-700 transition-colors" onclick="openEditStockModal('${d.id}')">Edit</button>
                <button class="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors" onclick="deleteItem('${d.id}')">Delete</button>
            </td>
        </tr>`;
    });
}

// Advanced Search and Filtering
const stockSearch = document.getElementById('stock-search');
const filterCategorySelect = document.getElementById('filter-category');
const filterVendorSelect = document.getElementById('filter-vendor');
const filterLowStockCheckbox = document.getElementById('filter-low-stock');

function applyFiltersAndSort() {
    const searchTerm = stockSearch.value.toLowerCase();
    const filterCategory = filterCategorySelect.value;
    const filterVendor = filterVendorSelect.value;
    const showLowStock = filterLowStockCheckbox.checked;

    let filteredData = allStockData.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !filterCategory || d.category === filterCategory;
        const matchesVendor = !filterVendor || d.vendorId === filterVendor;
        const matchesLowStock = !showLowStock || d.quantity <= d.minStock;
        return matchesSearch && matchesCategory && matchesVendor && matchesLowStock;
    });

    // Apply sorting
    const sortedHeader = document.querySelector('th[data-sort][data-order]');
    let sortBy = null;
    let sortOrder = 'asc';
    
    // Safely get sorting data only if the element exists
    if (sortedHeader) {
        sortBy = sortedHeader.dataset.sort;
        sortOrder = sortedHeader.dataset.order;
    }

    if (sortBy) {
        filteredData = [...filteredData].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            if (typeof aValue === 'string') {
                aValue = aValue ? aValue.toLowerCase() : '';
                bValue = bValue ? bValue.toLowerCase() : '';
            }
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    displayStockData(filteredData);
}

stockSearch.addEventListener('input', applyFiltersAndSort);
filterCategorySelect.addEventListener('change', applyFiltersAndSort);
filterVendorSelect.addEventListener('change', applyFiltersAndSort);
filterLowStockCheckbox.addEventListener('change', applyFiltersAndSort);

function populateFilterOptions() {
    // Populate Category Filter
    const categories = [...new Set(allStockData.map(d => d.category).filter(Boolean))];
    const currentCatFilter = filterCategorySelect.value;
    filterCategorySelect.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        filterCategorySelect.appendChild(option);
    });
    filterCategorySelect.value = currentCatFilter;

    // Populate Vendor Filter
    const currentVendorFilter = filterVendorSelect.value;
    filterVendorSelect.innerHTML = `<option value="">All Vendors</option>`;
    allVendorsData.forEach(vendor => {
        const option = document.createElement("option");
        option.value = vendor.id;
        option.textContent = vendor.name;
        filterVendorSelect.appendChild(option);
    });
    filterVendorSelect.value = currentVendorFilter;
}

// Sorting
document.querySelectorAll('th[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
        const sortBy = header.dataset.sort;
        const sortOrder = header.dataset.order === 'asc' ? 'desc' : 'asc';
        document.querySelectorAll('th[data-sort]').forEach(th => th.removeAttribute('data-order'));
        header.dataset.order = sortOrder;
        applyFiltersAndSort();
    });
});

// Download CSV for Stock Details
document.getElementById('download-stock-csv').addEventListener('click', () => {
    const dataToExport = allStockData.map(({ id, createdBy, createdAt, ...rest }) => rest);
    exportToCsv('stock-details.csv', dataToExport);
});

// Delete Stock
window.deleteItem = async id => {
    showConfirmationModal("Are you sure you want to delete this item?", async () => {
        const stockData = allStockData.find(d => d.id === id);
        await deleteDoc(doc(stockCollection, id));
        await logActivity("Deleted", `Deleted item: ${stockData.name}`);
    });
}

// Use Stock
const useStockForm = document.getElementById("useStockForm");
const useItemSelect = document.getElementById("useItemSelect");
const currentStockInfo = document.getElementById("current-stock-info");
const transactionHistoryList = document.getElementById("transaction-history");

useItemSelect.addEventListener('change', () => {
    const selectedId = useItemSelect.value;
    const selectedItem = allStockData.find(item => item.id === selectedId);
    if (selectedItem) {
        currentStockInfo.textContent = `${selectedItem.quantity} ${selectedItem.unit || ''} units available.`;
    } else {
        currentStockInfo.textContent = '-';
    }
});

useStockForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const id = useItemSelect.value;
    const qtyUse = parseInt(document.getElementById("useQuantity").value);

    if(!id || qtyUse <= 0 || isNaN(qtyUse)) {
        loginErrorEl.textContent = "Please select an item and enter a valid quantity.";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
        return;
    }

    try {
        const docRef = doc(stockCollection, id);
        const stockData = allStockData.find(item => item.id === id);

        if (stockData.quantity < qtyUse) {
            loginErrorEl.textContent = `Not enough stock. Only ${stockData.quantity} available.`;
            setTimeout(() => loginErrorEl.textContent = "", 3000);
            return;
        }

        const newQuantity = stockData.quantity - qtyUse;
        await updateDoc(docRef, { quantity: newQuantity });

        // Add Used Stock Entry
        await addDoc(usedStockCollection, {
            name: stockData.name,
            category: stockData.category,
            quantityUsed: qtyUse,
            unit: stockData.unit,
            usedAt: new Date(),
            value: qtyUse * stockData.price
        });

        await logActivity("Used", `Used ${qtyUse} of ${stockData.name}`);
        
        useStockForm.reset();
        loginErrorEl.textContent = "Stock used successfully! ✅";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
    } catch(err) {
        console.error("Error using stock: ", err);
        loginErrorEl.textContent = "An error occurred while using stock.";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
    }
});

// Load Options in Use Stock Select
function loadStockOptions(){
    const select = document.getElementById("useItemSelect");
    select.innerHTML = "";
    select.innerHTML += `<option value="" disabled selected>-- Select an item --</option>`;
    allStockData.forEach(d=>{
        select.innerHTML += `<option value="${d.id}">${d.name} (Qty: ${d.quantity} ${d.unit || ''})</option>`;
    });
}

// Used Stock Report
let allUsedDataFiltered = [];
function updateUsedStock(data){
    const tableBody = document.querySelector("#usedStockTable tbody");
    const totalUsedItemsEl = document.getElementById("total-used-items");
    const totalUsedValueEl = document.getElementById("total-used-value");
    tableBody.innerHTML = "";
    
    allUsedDataFiltered = data;
    const dateFilter = document.getElementById("used-stock-date-filter").value;
    if (dateFilter) {
        allUsedDataFiltered = data.filter(d => {
            const usedDate = d.usedAt.toDate().toISOString().split('T')[0];
            return usedDate === dateFilter;
        });
    }

    let totalUsedItems = 0;
    let totalUsedValue = 0;

    allUsedDataFiltered.forEach(d=>{
        totalUsedItems += d.quantityUsed;
        totalUsedValue += d.value || 0;
        const date = d.usedAt?.toDate ? d.usedAt.toDate().toLocaleString() : new Date(d.usedAt).toLocaleString();
        tableBody.innerHTML += `<tr>
            <td class="px-6 py-4">${d.name}</td>
            <td class="px-6 py-4">${d.category || ''}</td>
            <td class="px-6 py-4">${d.quantityUsed}</td>
            <td class="px-6 py-4">${d.unit || ''}</td>
            <td class="px-6 py-4">${date}</td>
            <td class="px-6 py-4 flex justify-end space-x-2">
                <button class="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors" onclick="deleteUsedItem('${d.id}')">Delete</button>
            </td>
        </tr>`;
    });

    totalUsedItemsEl.innerText = totalUsedItems;
    totalUsedValueEl.innerText = `$${totalUsedValue.toFixed(2)}`;

    // Populate recent transactions
    const recentTransactions = [...data]
        .sort((a, b) => b.usedAt.toDate() - a.usedAt.toDate())
        .slice(0, 5);

    transactionHistoryList.innerHTML = recentTransactions.length > 0 ? '' : '<li class="text-gray-600">No recent transactions.</li>';
    recentTransactions.forEach(t => {
        const date = t.usedAt?.toDate ? t.usedAt.toDate().toLocaleString() : new Date(t.usedAt).toLocaleString();
        transactionHistoryList.innerHTML += `<li class="text-gray-600"><strong>${t.name}</strong>: ${t.quantityUsed} ${t.unit || ''} used on ${date}</li>`;
    });
}

document.getElementById("used-stock-date-filter").addEventListener("change", e => {
    updateUsedStock(allUsedData);
});

// Download CSV for Used Stock Report
document.getElementById('download-used-csv').addEventListener('click', () => {
    // Re-filter the data just before export to ensure it matches what's displayed
    const dataToExport = allUsedData.filter(d => {
        const dateFilter = document.getElementById("used-stock-date-filter").value;
        if (!dateFilter) return true;
        const usedDate = d.usedAt.toDate().toISOString().split('T')[0];
        return usedDate === dateFilter;
    }).map(({ id, ...rest }) => ({
        ...rest,
        usedAt: rest.usedAt.toDate().toLocaleString()
    }));
    exportToCsv('used-stock-report.csv', dataToExport);
});

// Delete Used Stock
window.deleteUsedItem = async id => {
    showConfirmationModal("Are you sure you want to delete this used stock entry?", async () => {
        try {
            await deleteDoc(doc(usedStockCollection, id));
            await logActivity("Deleted", `Deleted used stock entry with ID: ${id}`);
        } catch(err) {
            console.error("Error deleting used stock: ", err);
            loginErrorEl.textContent = "An error occurred while deleting the entry.";
            setTimeout(() => loginErrorEl.textContent = "", 3000);
        }
    });
}

// Dashboard Metrics
let lowStockChart = null;
let categoryBarChart = null;
let categoryPieChart = null;
let activityFeed = null;
function updateDashboard(data){
    let totalItems = 0, totalValue = 0;
    const categories = new Set();
    const categoryCounts = {};
    const lowStockItems = [];

    data.forEach(d=>{
        totalItems += d.quantity;
        totalValue += d.quantity * d.price;
        if(d.category) categories.add(d.category);
        if(d.category) categoryCounts[d.category] = (categoryCounts[d.category] || 0) + d.quantity;
        if(d.quantity <= d.minStock) {
            lowStockItems.push(d);
        }
    });

    // Update both Dashboard and Home Page cards
    document.getElementById("total-items").innerText = totalItems;
    document.getElementById("total-value").innerText = `$${totalValue.toFixed(2)}`;
    document.getElementById("unique-categories").innerText = categories.size;
    document.getElementById("home-total-items").innerText = totalItems;
    document.getElementById("home-total-value").innerText = `$${totalValue.toFixed(2)}`;
    document.getElementById("home-unique-categories").innerText = categories.size;

    // Update Low Stock Alerts on Home Page
    const lowStockAlertsContainer = document.getElementById("low-stock-alerts");
    lowStockAlertsContainer.innerHTML = '';
    if (lowStockItems.length === 0) {
        lowStockAlertsContainer.innerHTML = `<div class="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100"><p class="text-gray-500">No low stock items. All good! 😊</p></div>`;
    } else {
        lowStockItems.forEach(item => {
            lowStockAlertsContainer.innerHTML += `
                <div class="bg-white rounded-2xl shadow-lg p-6 flex justify-between items-center border border-red-300 animate-pulse-once">
                    <div>
                        <p class="font-semibold text-red-600">${item.name}</p>
                        <p class="text-sm text-gray-500">Current: ${item.quantity} ${item.unit || ''} / Min: ${item.minStock}</p>
                    </div>
                    <a href="#stock-details" class="nav-link text-sky-600 hover:underline" data-page="stock-details-page">View Details</a>
                </div>
            `;
        });
    }

    // Charts update
    const categoryLabels = Object.keys(categoryCounts);
    const categoryData = Object.values(categoryCounts);

    // Bar Chart
    const ctxBar = document.getElementById("category-bar-chart").getContext("2d");
    if(categoryBarChart) categoryBarChart.destroy();
    categoryBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: { labels: categoryLabels, datasets: [{ label: 'Quantity', data: categoryData, backgroundColor: '#0ea5e9' }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    // Pie Chart
    const ctxPie = document.getElementById("category-pie-chart").getContext("2d");
    if(categoryPieChart) categoryPieChart.destroy();
    categoryPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: { labels: categoryLabels, datasets: [{ data: categoryData, backgroundColor: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'] }] },
        options: { responsive: true }
    });
    
    // Low Stock Chart (Horizontal Bar)
    const ctxLowStock = document.getElementById("low-stock-chart").getContext("2d");
    if(lowStockChart) lowStockChart.destroy();
    const lowStockLabels = lowStockItems.map(item => item.name);
    const lowStockQuantities = lowStockItems.map(item => item.quantity);
    lowStockChart = new Chart(ctxLowStock, {
        type: 'bar',
        data: {
            labels: lowStockLabels,
            datasets: [{
                label: 'Quantity',
                data: lowStockQuantities,
                backgroundColor: '#dc2626',
                borderColor: '#b91c1c',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true },
                y: { beginAtZero: true }
            }
        }
    });
}

function updateActivityFeed(recentActivity) {
    const activityFeedList = document.getElementById("activity-feed");
    activityFeedList.innerHTML = recentActivity.length > 0 ? '' : '<li class="text-gray-600">No recent activity.</li>';
    recentActivity.forEach(activity => {
        const time = activity.timestamp.toDate().toLocaleTimeString();
        activityFeedList.innerHTML += `<li class="text-gray-600"><strong>[${time} by ${activity.user}]</strong> ${activity.action}: ${activity.details}</li>`;
    });
}

// Universal CSV Export Function
function exportToCsv(filename, data) {
    if (!data || data.length === 0) {
        loginErrorEl.textContent = "No data to export!";
        setTimeout(() => loginErrorEl.textContent = "", 3000);
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add header row

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header] !== null && row[header] !== undefined ? row[header] : '';
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
