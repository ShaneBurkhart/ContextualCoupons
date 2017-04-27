CREATE TABLE ShopifyShops (
    id BIGSERIAL PRIMARY KEY,
    shop VARCHAR(100) NOT NULL, /* Sufficient length */
    shopify_access_token VARCHAR(50) NOT NULL, /* Sufficient length */
    mailchimp_access_token VARCHAR(50), /* Sufficient length */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
