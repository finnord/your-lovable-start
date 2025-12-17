"""
Test suite for Mare Mio Christmas Order App.
Tests the core business logic and data flow.

Run with: pytest test_app.py -v
"""

import pytest
import pandas as pd
from pathlib import Path
from collections import defaultdict
from io import BytesIO

# ═══════════════════════════════════════════════════════════════════════════════
# IMPORT APP FUNCTIONS (without Streamlit context)
# ═══════════════════════════════════════════════════════════════════════════════

# We test the pure logic functions directly, not the Streamlit UI

FALLBACK_MENU = {
    "Antipasti": ["Insalata russa", "Cocktail di gamberi", "Polpo mediterraneo"],
    "Crudi": ["Tartare di tonno", "Tartare di salmone", "Tartare di orata"],
    "Primi": [
        "Lasagna mazzancolle",
        "Crespelle gamberi e zucchine",
        "Lasagna branzino e carciofi",
        "Cannelloni salmone e ricotta",
    ],
    "Sughi": ["Sugo astice", "Sugo pescatora", "Pesto di mare"],
    "Secondi": ["Polpo mediterranea", "Baccalà", "Branzino"],
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTION IMPLEMENTATIONS (duplicated for testing without Streamlit)
# ═══════════════════════════════════════════════════════════════════════════════

def build_orders_dataframe(orders: list[dict]) -> pd.DataFrame:
    """Convert orders to DataFrame."""
    rows: list[dict] = []
    for order in orders:
        for item in order["items"]:
            rows.append(
                {
                    "ordine": order["order_id"],
                    "cliente": order["customer"],
                    "contatto": order["contact"],
                    "categoria": item["category"],
                    "piatto": item["dish"],
                    "porzione": f"per {item['portion']}",
                    "vassoi": item["qty"],
                    "coperti": item["qty"] * item["portion"],
                    "note": order["note"],
                },
            )
    if not rows:
        return pd.DataFrame(
            columns=[
                "ordine",
                "cliente",
                "contatto",
                "categoria",
                "piatto",
                "porzione",
                "vassoi",
                "coperti",
                "note",
            ],
        )
    return pd.DataFrame(rows)


def build_totals(orders: list[dict]) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Calculate totals and frequency distribution."""
    totals = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    freq = defaultdict(lambda: defaultdict(int))

    for order in orders:
        for item in order["items"]:
            totals[item["category"]][item["dish"]][item["portion"]] += item["qty"]
            freq[item["dish"]][item["qty"]] += 1

    totals_rows: list[dict] = []
    for category, dishes in totals.items():
        for dish, portions in dishes.items():
            for portion, qty in sorted(portions.items()):
                totals_rows.append(
                    {
                        "categoria": category,
                        "piatto": dish,
                        "porzione": f"per {portion}",
                        "vassoi": qty,
                        "coperti": qty * portion,
                    },
                )

    freq_rows: list[dict] = []
    for dish, counts in freq.items():
        for qty, count in sorted(counts.items()):
            freq_rows.append(
                {
                    "piatto": dish,
                    "qta": qty,
                    "frequenza": count,
                },
            )

    totals_df = pd.DataFrame(
        totals_rows,
        columns=["categoria", "piatto", "porzione", "vassoi", "coperti"],
    )
    if not totals_df.empty:
        totals_df = totals_df.sort_values(["categoria", "piatto", "porzione"])

    freq_df = pd.DataFrame(
        freq_rows,
        columns=["piatto", "qta", "frequenza"],
    )
    if not freq_df.empty:
        freq_df = freq_df.sort_values(["piatto", "qta"])

    return totals_df, freq_df


def export_excel(orders_df: pd.DataFrame, totals_df: pd.DataFrame, freq_df: pd.DataFrame) -> BytesIO:
    """Export data to Excel."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        orders_df.to_excel(writer, index=False, sheet_name="Ordini")
        totals_df.to_excel(writer, index=False, sheet_name="Totali")
        freq_df.to_excel(writer, index=False, sheet_name="Frequenze")
    output.seek(0)
    return output


def build_default_hot_buttons(menu: dict[str, list[str]]) -> list[dict]:
    """Create default hot buttons from menu."""
    buttons: list[dict] = []
    for category, dishes in menu.items():
        if not dishes:
            continue
        buttons.append({"label": dishes[0], "category": category, "dish": dishes[0]})
        if len(buttons) >= 6:
            break
    return buttons


def validate_order(customer: str, contact: str, items: list[dict]) -> tuple[bool, list[str]]:
    """Validate an order before saving. Returns (is_valid, list_of_errors)."""
    errors = []
    
    if not customer or not customer.strip():
        errors.append("Cliente è obbligatorio")
    
    if not contact or not contact.strip():
        errors.append("Contatto è obbligatorio")
    
    if not items:
        errors.append("Aggiungi almeno un piatto")
    
    return len(errors) == 0, errors


def validate_item(category: str, dish: str, portion: int, qty: int, menu: dict) -> tuple[bool, list[str]]:
    """Validate an item before adding to cart. Returns (is_valid, list_of_errors)."""
    errors = []
    
    if category not in menu:
        errors.append(f"Categoria '{category}' non trovata nel menu")
    elif dish not in menu[category]:
        errors.append(f"Piatto '{dish}' non trovato in '{category}'")
    
    if portion not in [1, 2, 3]:
        errors.append(f"Formato '{portion}' non valido (deve essere 1, 2, o 3)")
    
    if qty < 1:
        errors.append(f"Quantità '{qty}' non valida (deve essere >= 1)")
    
    return len(errors) == 0, errors


# ═══════════════════════════════════════════════════════════════════════════════
# TEST FIXTURES
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def sample_menu():
    """Sample menu for testing."""
    return FALLBACK_MENU


@pytest.fixture
def sample_order():
    """A sample valid order."""
    return {
        "order_id": 100,
        "customer": "Mario Rossi",
        "contact": "+39 333 1234567",
        "note": "Allergia ai crostacei",
        "items": [
            {"category": "Antipasti", "dish": "Insalata russa", "portion": 2, "qty": 1},
            {"category": "Primi", "dish": "Lasagna mazzancolle", "portion": 1, "qty": 2},
        ],
    }


@pytest.fixture
def sample_orders():
    """Multiple sample orders for testing aggregations."""
    return [
        {
            "order_id": 100,
            "customer": "Mario Rossi",
            "contact": "+39 333 1234567",
            "note": "",
            "items": [
                {"category": "Antipasti", "dish": "Insalata russa", "portion": 2, "qty": 1},
                {"category": "Primi", "dish": "Lasagna mazzancolle", "portion": 1, "qty": 2},
            ],
        },
        {
            "order_id": 101,
            "customer": "Giulia Bianchi",
            "contact": "giulia@email.com",
            "note": "No glutine",
            "items": [
                {"category": "Antipasti", "dish": "Insalata russa", "portion": 1, "qty": 1},
                {"category": "Crudi", "dish": "Tartare di tonno", "portion": 2, "qty": 3},
            ],
        },
        {
            "order_id": 102,
            "customer": "Mario Rossi",
            "contact": "+39 333 1234567",
            "note": "",
            "items": [
                {"category": "Secondi", "dish": "Branzino", "portion": 3, "qty": 1},
            ],
        },
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: MENU
# ═══════════════════════════════════════════════════════════════════════════════

class TestMenu:
    """Tests for menu structure and access."""
    
    def test_menu_has_all_categories(self, sample_menu):
        """Menu should have all expected categories."""
        expected = ["Antipasti", "Crudi", "Primi", "Sughi", "Secondi"]
        for cat in expected:
            assert cat in sample_menu, f"Missing category: {cat}"
    
    def test_each_category_has_dishes(self, sample_menu):
        """Each category should have at least one dish."""
        for category, dishes in sample_menu.items():
            assert len(dishes) > 0, f"Category '{category}' has no dishes"
    
    def test_dishes_are_strings(self, sample_menu):
        """All dish names should be non-empty strings."""
        for category, dishes in sample_menu.items():
            for dish in dishes:
                assert isinstance(dish, str), f"Dish in '{category}' is not a string: {dish}"
                assert len(dish.strip()) > 0, f"Empty dish name in '{category}'"


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: ORDER VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestOrderValidation:
    """Tests for order validation logic."""
    
    def test_valid_order_passes(self, sample_order):
        """A complete order should be valid."""
        is_valid, errors = validate_order(
            sample_order["customer"],
            sample_order["contact"],
            sample_order["items"]
        )
        assert is_valid, f"Valid order rejected: {errors}"
        assert len(errors) == 0
    
    def test_empty_customer_fails(self, sample_order):
        """Order with empty customer should fail."""
        is_valid, errors = validate_order("", sample_order["contact"], sample_order["items"])
        assert not is_valid
        assert "Cliente è obbligatorio" in errors
    
    def test_whitespace_customer_fails(self, sample_order):
        """Order with whitespace-only customer should fail."""
        is_valid, errors = validate_order("   ", sample_order["contact"], sample_order["items"])
        assert not is_valid
        assert "Cliente è obbligatorio" in errors
    
    def test_empty_contact_fails(self, sample_order):
        """Order with empty contact should fail."""
        is_valid, errors = validate_order(sample_order["customer"], "", sample_order["items"])
        assert not is_valid
        assert "Contatto è obbligatorio" in errors
    
    def test_empty_items_fails(self, sample_order):
        """Order with no items should fail."""
        is_valid, errors = validate_order(sample_order["customer"], sample_order["contact"], [])
        assert not is_valid
        assert "Aggiungi almeno un piatto" in errors
    
    def test_multiple_errors_reported(self):
        """All validation errors should be reported."""
        is_valid, errors = validate_order("", "", [])
        assert not is_valid
        assert len(errors) == 3


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: ITEM VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestItemValidation:
    """Tests for cart item validation."""
    
    def test_valid_item_passes(self, sample_menu):
        """A valid item should pass validation."""
        is_valid, errors = validate_item("Antipasti", "Insalata russa", 2, 1, sample_menu)
        assert is_valid, f"Valid item rejected: {errors}"
    
    def test_invalid_category_fails(self, sample_menu):
        """Item with invalid category should fail."""
        is_valid, errors = validate_item("Dolci", "Tiramisu", 1, 1, sample_menu)
        assert not is_valid
        assert any("Categoria" in e for e in errors)
    
    def test_invalid_dish_fails(self, sample_menu):
        """Item with invalid dish for category should fail."""
        is_valid, errors = validate_item("Antipasti", "Piatto Inesistente", 1, 1, sample_menu)
        assert not is_valid
        assert any("Piatto" in e for e in errors)
    
    def test_invalid_portion_fails(self, sample_menu):
        """Item with invalid portion should fail."""
        is_valid, errors = validate_item("Antipasti", "Insalata russa", 5, 1, sample_menu)
        assert not is_valid
        assert any("Formato" in e for e in errors)
    
    def test_zero_quantity_fails(self, sample_menu):
        """Item with zero quantity should fail."""
        is_valid, errors = validate_item("Antipasti", "Insalata russa", 1, 0, sample_menu)
        assert not is_valid
        assert any("Quantità" in e for e in errors)
    
    def test_negative_quantity_fails(self, sample_menu):
        """Item with negative quantity should fail."""
        is_valid, errors = validate_item("Antipasti", "Insalata russa", 1, -1, sample_menu)
        assert not is_valid


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: DATAFRAME CONVERSION
# ═══════════════════════════════════════════════════════════════════════════════

class TestDataFrameConversion:
    """Tests for order to DataFrame conversion."""
    
    def test_empty_orders_returns_empty_df(self):
        """Empty orders list should return empty DataFrame with correct columns."""
        df = build_orders_dataframe([])
        assert df.empty
        expected_cols = ["ordine", "cliente", "contatto", "categoria", "piatto", 
                        "porzione", "vassoi", "coperti", "note"]
        assert list(df.columns) == expected_cols
    
    def test_single_order_conversion(self, sample_order):
        """Single order should convert correctly."""
        df = build_orders_dataframe([sample_order])
        assert len(df) == 2  # 2 items in sample order
        assert df["ordine"].iloc[0] == 100
        assert df["cliente"].iloc[0] == "Mario Rossi"
    
    def test_coperti_calculation(self, sample_order):
        """Coperti should equal qty * portion."""
        df = build_orders_dataframe([sample_order])
        for _, row in df.iterrows():
            # Extract portion number from "per X" string
            portion = int(row["porzione"].replace("per ", ""))
            expected_coperti = row["vassoi"] * portion
            assert row["coperti"] == expected_coperti
    
    def test_multiple_orders(self, sample_orders):
        """Multiple orders should all be included."""
        df = build_orders_dataframe(sample_orders)
        assert len(df) == 5  # Total items across all orders
        assert df["ordine"].nunique() == 3  # 3 unique orders


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: TOTALS CALCULATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestTotalsCalculation:
    """Tests for totals and frequency calculations."""
    
    def test_empty_orders_returns_empty_totals(self):
        """Empty orders should return empty totals."""
        totals_df, freq_df = build_totals([])
        assert totals_df.empty
        assert freq_df.empty
    
    def test_totals_aggregation(self, sample_orders):
        """Totals should correctly aggregate same dishes."""
        totals_df, freq_df = build_totals(sample_orders)
        
        # Check Insalata russa totals (ordered by 2 customers)
        insalata_rows = totals_df[totals_df["piatto"] == "Insalata russa"]
        assert len(insalata_rows) == 2  # 2 different portions
    
    def test_frequency_calculation(self, sample_orders):
        """Frequency should count how often each qty was ordered."""
        totals_df, freq_df = build_totals(sample_orders)
        assert not freq_df.empty
        
        # Check that frequency values make sense
        for _, row in freq_df.iterrows():
            assert row["frequenza"] >= 1


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: EXCEL EXPORT
# ═══════════════════════════════════════════════════════════════════════════════

class TestExcelExport:
    """Tests for Excel export functionality."""
    
    def test_export_returns_bytes(self, sample_orders):
        """Export should return a BytesIO object."""
        orders_df = build_orders_dataframe(sample_orders)
        totals_df, freq_df = build_totals(sample_orders)
        result = export_excel(orders_df, totals_df, freq_df)
        
        assert isinstance(result, BytesIO)
        assert result.getvalue()  # Should have content
    
    def test_export_has_correct_sheets(self, sample_orders):
        """Exported Excel should have all expected sheets."""
        orders_df = build_orders_dataframe(sample_orders)
        totals_df, freq_df = build_totals(sample_orders)
        result = export_excel(orders_df, totals_df, freq_df)
        
        # Read back the Excel file
        excel_data = pd.ExcelFile(result)
        sheets = excel_data.sheet_names
        
        assert "Ordini" in sheets
        assert "Totali" in sheets
        assert "Frequenze" in sheets


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: HOT BUTTONS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHotButtons:
    """Tests for hot button functionality."""
    
    def test_default_hot_buttons_created(self, sample_menu):
        """Default hot buttons should be created from menu."""
        buttons = build_default_hot_buttons(sample_menu)
        assert len(buttons) > 0
        assert len(buttons) <= 6  # Max 6 buttons
    
    def test_hot_button_structure(self, sample_menu):
        """Each hot button should have required fields."""
        buttons = build_default_hot_buttons(sample_menu)
        for btn in buttons:
            assert "label" in btn
            assert "category" in btn
            assert "dish" in btn
            # Verify the dish exists in the menu
            assert btn["category"] in sample_menu
            assert btn["dish"] in sample_menu[btn["category"]]


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: WORKFLOW SIMULATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestOrderWorkflow:
    """Tests simulating the full order workflow."""
    
    def test_create_new_order_workflow(self, sample_menu):
        """Simulate creating a new order from scratch."""
        # Simulated session state
        orders = []
        current_items = []
        next_order_id = 100
        
        # Step 1: Add customer info (simulated)
        customer = "Test Customer"
        contact = "test@email.com"
        note = "Test note"
        
        # Step 2: Add items to cart
        item1 = {"category": "Antipasti", "dish": "Insalata russa", "portion": 2, "qty": 1}
        is_valid, _ = validate_item(item1["category"], item1["dish"], item1["portion"], item1["qty"], sample_menu)
        assert is_valid
        current_items.append(item1)
        
        item2 = {"category": "Primi", "dish": "Lasagna mazzancolle", "portion": 1, "qty": 2}
        is_valid, _ = validate_item(item2["category"], item2["dish"], item2["portion"], item2["qty"], sample_menu)
        assert is_valid
        current_items.append(item2)
        
        # Step 3: Validate before save
        is_valid, errors = validate_order(customer, contact, current_items)
        assert is_valid, f"Order validation failed: {errors}"
        
        # Step 4: Save order
        new_order = {
            "order_id": next_order_id,
            "customer": customer.strip(),
            "contact": contact.strip(),
            "note": note.strip(),
            "items": list(current_items),
        }
        orders.append(new_order)
        current_items.clear()
        next_order_id += 1
        
        # Verify
        assert len(orders) == 1
        assert orders[0]["order_id"] == 100
        assert len(orders[0]["items"]) == 2
        assert len(current_items) == 0
        assert next_order_id == 101
    
    def test_edit_order_workflow(self, sample_orders, sample_menu):
        """Simulate editing an existing order."""
        orders = list(sample_orders)
        
        # Find order to edit
        order_to_edit = next(o for o in orders if o["order_id"] == 101)
        
        # Load into edit mode
        editing_order_id = order_to_edit["order_id"]
        form_customer = order_to_edit["customer"]
        form_contact = order_to_edit["contact"]
        form_note = order_to_edit["note"]
        current_items = list(order_to_edit["items"])
        
        # Make changes
        form_customer = "Giulia Bianchi Updated"
        current_items.append({"category": "Secondi", "dish": "Baccalà", "portion": 2, "qty": 1})
        
        # Save changes
        for idx, order in enumerate(orders):
            if order["order_id"] == editing_order_id:
                orders[idx] = {
                    "order_id": editing_order_id,
                    "customer": form_customer.strip(),
                    "contact": form_contact.strip(),
                    "note": form_note.strip(),
                    "items": list(current_items),
                }
                break
        
        # Verify
        updated_order = next(o for o in orders if o["order_id"] == 101)
        assert updated_order["customer"] == "Giulia Bianchi Updated"
        assert len(updated_order["items"]) == 3  # Original 2 + 1 new
    
    def test_delete_order_workflow(self, sample_orders):
        """Simulate deleting an order."""
        orders = list(sample_orders)
        initial_count = len(orders)
        
        # Delete order 101
        order_id_to_delete = 101
        orders = [o for o in orders if o["order_id"] != order_id_to_delete]
        
        # Verify
        assert len(orders) == initial_count - 1
        assert not any(o["order_id"] == 101 for o in orders)


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASES: EDGE CASES
# ═══════════════════════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Tests for edge cases and error conditions."""
    
    def test_special_characters_in_customer_name(self, sample_menu):
        """Customer name with special characters should work."""
        customer = "O'Brien, José-María"
        contact = "test@test.com"
        items = [{"category": "Antipasti", "dish": "Insalata russa", "portion": 1, "qty": 1}]
        
        is_valid, errors = validate_order(customer, contact, items)
        assert is_valid
    
    def test_unicode_in_notes(self):
        """Notes with unicode should work correctly."""
        order = {
            "order_id": 100,
            "customer": "Test",
            "contact": "test@test.com",
            "note": "Emoji 🎄 and accents: àèéìòù",
            "items": [{"category": "Antipasti", "dish": "Insalata russa", "portion": 1, "qty": 1}],
        }
        
        df = build_orders_dataframe([order])
        assert "🎄" in df["note"].iloc[0]
    
    def test_very_long_customer_name(self, sample_menu):
        """Very long customer names should still work."""
        customer = "A" * 500
        contact = "test@test.com"
        items = [{"category": "Antipasti", "dish": "Insalata russa", "portion": 1, "qty": 1}]
        
        is_valid, errors = validate_order(customer, contact, items)
        assert is_valid
    
    def test_large_quantity(self, sample_menu):
        """Large quantity values should work."""
        is_valid, errors = validate_item("Antipasti", "Insalata russa", 1, 999, sample_menu)
        assert is_valid
    
    def test_empty_menu_category(self):
        """Menu with empty category should handle hot buttons gracefully."""
        menu_with_empty = {
            "Empty": [],
            "HasItems": ["Item 1", "Item 2"],
        }
        buttons = build_default_hot_buttons(menu_with_empty)
        assert len(buttons) == 1
        assert buttons[0]["category"] == "HasItems"


# ═══════════════════════════════════════════════════════════════════════════════
# RUN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
