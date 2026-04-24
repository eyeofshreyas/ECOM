import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentProps {
    clientSecret: string;
    onSuccess: () => void;
}

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#1a1a1a',
            fontFamily: 'inherit',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#ef4444' },
    },
};

export default function StripePayment({ clientSecret, onSuccess }: StripePaymentProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [processing, setProcessing] = useState(false);

    const handlePay = async () => {
        if (!stripe || !elements) return;

        setProcessing(true);
        const cardElement = elements.getElement(CardElement);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement! },
        });

        if (error) {
            toast({
                title: 'Payment Failed',
                description: error.message,
                variant: 'destructive',
            });
            setProcessing(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            onSuccess();
        }
    };

    // Uses a div, not a form — this component is rendered inside Checkout's <form>
    // and nested forms are invalid HTML.
    return (
        <div className="space-y-4 mt-4">
            <div className="border border-border rounded-lg p-4 bg-background">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            <p className="text-xs text-muted-foreground">
                Test card: 4242 4242 4242 4242 — any future date — any 3-digit CVC
            </p>
            <Button type="button" onClick={handlePay} className="w-full" disabled={!stripe || processing}>
                {processing ? 'Processing...' : 'Pay with Card'}
            </Button>
        </div>
    );
}
