// package com.appGate.inventory.kafka;


// import org.apache.kafka.clients.consumer.ConsumerRecord; 
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.kafka.annotation.KafkaListener;
// import org.springframework.kafka.listener.ConsumerSeekAware; 

// import org.springframework.stereotype.Service;


// @Service
// public class ProductViewEventConsumer  implements ConsumerSeekAware {

//     @Autowired
//     private PopularProductCache popularProductCache;

//     @Override
//     public void registerSeekCallback(ConsumerSeekCallback callback) {
//         callback.seekToBeginning("product-topic", 0);
//     }

//     @KafkaListener(topics = "product-topic", groupId = "product-group")
//     public void consumeOrderEvent(ConsumerRecord<String, String> record) {

//         System.out.println("Consumed record: " + record.toString());
//         String productId = record.value();
//         popularProductCache.incrementProductCount(Long.valueOf(productId));
//     }
// }
