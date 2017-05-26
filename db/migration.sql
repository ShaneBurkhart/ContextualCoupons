CREATE TABLE ShopifyShops (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, /* Sufficient length */
    shopify_access_token VARCHAR(50) NOT NULL, /* Sufficient length */
    mailchimp_access_token VARCHAR(50), /* Sufficient length */
    mailchimp_api_endpoint VARCHAR(50), /* Sufficient length */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE ShopifyDiscounts (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGSERIAL NOT NULL,
    name VARCHAR(50) NOT NULL, /* Sufficient length */
    mailchimp_list_id VARCHAR(50) NOT NULL, /* Sufficient length */
    mailchimp_automation_id VARCHAR(50) NOT NULL, /* Sufficient length */
    type VARCHAR(50) NOT NULL, /* Sufficient length */
    value VARCHAR(50), /* Sufficient length */
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
