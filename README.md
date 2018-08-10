# JWT Federation OpenID Connect Client


Proof of concept demo of OpenID Connect Federation Client.


```
npm start
```


## Update kubernets cnofig

```
kubectl delete deployment jwtfed-client
kubectl delete service jwtfed-client
kubectl apply -f deployment.yaml
```

```
kubectl delete deployment jwtfed-client
kubectl apply -f deployment.yaml
```

## Local build process

To test the docker build:

```
docker build -t jwtfedclient .
```
