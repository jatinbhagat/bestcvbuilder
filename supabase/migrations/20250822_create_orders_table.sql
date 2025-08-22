-- Create orders table for PayU payment integration
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL, -- Custom order ID format
    order_email VARCHAR(255) NOT NULL,
    order_mobile VARCHAR(20) NOT NULL,
    order_amount DECIMAL(10,2) DEFAULT 99.00 NOT NULL,
    order_currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    transaction_id VARCHAR(255), -- PayU transaction ID
    payment_id VARCHAR(255), -- PayU payment ID
    order_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL 
        CHECK (order_status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED')),
    payu_response JSONB, -- Store complete PayU response
    analysis_data JSONB, -- Store original analysis data for CV rewrite
    user_id UUID REFERENCES auth.users(id), -- Link to user if authenticated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_email ON orders(order_email);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Row Level Security policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        order_email = auth.jwt() ->> 'email'
    );

-- Policy: Service role can manage all orders (for API endpoints)
CREATE POLICY "Service role full access" ON orders
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Insert orders (allow anonymous order creation)
CREATE POLICY "Allow order creation" ON orders
    FOR INSERT WITH CHECK (true);

-- Policy: Update orders (allow status updates)
CREATE POLICY "Allow order updates" ON orders
    FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON TABLE orders IS 'PayU payment orders for CV rewrite service';
COMMENT ON COLUMN orders.order_id IS 'Custom order ID in format ORD_YYYYMMDD_XXXX';
COMMENT ON COLUMN orders.analysis_data IS 'Original ATS analysis data for post-payment processing';
COMMENT ON COLUMN orders.payu_response IS 'Complete PayU payment response for debugging';