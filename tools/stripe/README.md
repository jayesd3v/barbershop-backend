# Description
name: stripe-cli  
version: stripe_1.21.5_windows_x86_64  
releases: https://github.com/stripe/stripe-cli/releases  
docs: https://docs.stripe.com/stripe-cli  

# login

## Login through browser

```bash
stripe login
```

## Login with secret key

```bash
stripe login --api-key sk_test_4eC39HqLyjWDarjtT1zdp7dc
```

# Localhost forward

```bash
stripe listen --forward-to localhost:8080/webhook/payment
```

