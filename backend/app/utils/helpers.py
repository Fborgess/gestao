def product_label(product):
    if product is None:
        return None
    if product.unit and product.unit.abbreviation:
        return f"{product.name} {product.unit.abbreviation}"
    return product.name
