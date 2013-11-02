//
//  NSObject.h
//  FoundationExtension
//
//  Created by Jeong YunWon on 12. 10. 16..
//  Copyright (c) 2012 youknowone.org All rights reserved.
//

/*!
 *  @file
 *  @brief [NSObject][0] or Class extension category collection. Or [NSObject Protocol][1].
 *      [0]: https://developer.apple.com/library/mac/#documentation/Cocoa/Reference/Foundation/Classes/NSObject_Class/Reference/Reference.html
 *      [1]: https://developer.apple.com/library/mac/#documentation/Cocoa/Reference/Foundation/Protocols/NSObject_Protocol/Reference/NSObject.html
 */

#import <Foundation/Foundation.h>
#import <objc/runtime.h>

@class NSAMethod;

/*!
 *  @brief NSObject [<objc/runtime.h>][0] extensions
 *      [0]: https://developer.apple.com/library/mac/#documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html
 */
@interface NSObject (ObjCRuntime)

/*!
 *  @brief Class name of object.
 *  @see [object_getClassName][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/object_getClassName
 */
@property(nonatomic, readonly) NSString *className;

/*!
 *  @brief Obtains the value of an instance variable of a class instance.
 *  @param name The name of the instance variable definition to obtain.
 *  @see [object_getInstanceVariable][1]
 *  @see getVariable:forName:
 *  @see setVariable:forName:
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/object_getInstanceVariable
 */
- (id)variableForName:(NSString *)name;

/*!
 *  @brief Implement property getter for an instance variable.
 *  @param methodName The name of property getter.
 *  @param nameString A C String to represent the name of instance variable.
 *  @see variableForName:
 */
#define NSAPropertyGetter(methodName, nameString) - (id)methodName { return [self variableForName:nameString]; }

/*!
 *  @brief Obtains the value of an instance variable of a class instance.
 *  @param outValue On return, contains a pointer to the value of the instance variable.
 *  @param name The name of the instance variable definition to obtain.
 *  @see variableForName:
 *  @see setVariable:forName:
 *  @see [object_getInstanceVariable][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/object_getInstanceVariable
 */
- (void)getVariable:(void **)outValue forName:(NSString *)name;

/*!
 *  @brief Implement property getter for an instance variable.
 *  @param methodName The name of property getter.
 *  @param name A string. Pass the name of the instance variable whose value you wish to modify.
 *  @param type The type of of instance variable.
 *  @see getVariable:forName:
 */
#define NSAPropertyGetterForType(methodName, nameString, type) - (type)methodName { type outValue;  [self getVariable:(void **)&outValue forName:nameString]; return outValue; }

/*!
 *  @brief Changes the value of an instance variable of a class instance.
 *  @param value The new value for the instance variable.
 *  @param name A string. Pass the name of the instance variable whose value you wish to modify.
 *  @see variableForName:
 *  @see getVariable:forName:
 *  @see [object_setInstanceVariable][1]
 *      [1]: [https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/object_setInstanceVariable]
 */
- (void)setVariable:(void *)value forName:(NSString *)name;

/*!
 *  @brief Implement property assign setter for an instance variable.
 *  @param methodName The name of property getter.
 *  @param nameString A C String to represent the name of instance variable.
 *  @see setVariable:forName:
 */
#define NSAPropertyAssignSetter(methodName, nameString) - (void)methodName:(id)value { [self setVariable:value forName:nameString]; }

/*!
 *  @brief Implement property retain setter for an instance variable.
 *  @param methodName The name of property getter.
 *  @param nameString A C String to represent the name of instance variable.
 *  @see setVariable:forName:
 */
#define NSAPropertyRetainSetter(methodName, nameString) - (void)methodName:(id)value { [value retain]; [[self variableForName:nameString] release]; [self setVariable:value forName:nameString]; }

/*!
 *  @brief Implement property copy setter for an instance variable.
 *  @param methodName The name of property getter.
 *  @param nameString A C String to represent the name of instance variable.
 *  @see setVariable:forName:
 */
#define NSAPropertyCopySetter(methodName, nameString) - (void)methodName:(id)value { id copied = [value copy]; [[self variableForName:nameString] release]; [self setVariable:copied forName:nameString]; }


/*! @name performSelector */

/*!
 *  @brief Invokes a method of the receiver with 3 parameter
 *  @param aSelector A selector that identifies the method to invoke. The method should take 3 argument of type id.
 *  @param object1 a parameter
 *  @param object2 a parameter
 *  @param object3 a parameter
 *  @see [performSelector:withObject:][1]
 *  @see [performSelector:withObject:withObject:][2]
 *  @see performSelector:withObject:withObject:withObject:withObject:
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Protocols/NSObject_Protocol/Reference/NSObject.html#//apple_ref/occ/intfm/NSObject/performSelector:withObject:
 *      [2]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Protocols/NSObject_Protocol/Reference/NSObject.html#//apple_ref/occ/intfm/NSObject/performSelector:withObject:withObject:
 */
- (id)performSelector:(SEL)aSelector withObject:(id)object1 withObject:(id)object2 withObject:(id)object3;

/*!
 *  @brief Invokes a method of the receiver with 4 parameter
 *  @param aSelector A selector that identifies the method to invoke. The method should take 4 argument of type id.
 *  @param object1 a parameter
 *  @param object2 a parameter
 *  @param object3 a parameter
 *  @param object4 a parameter
 *  @see [performSelector:withObject:][1]
 *  @see [performSelector:withObject:withObject:][2]
 *  @see performSelector:withObject:withObject:withObject:
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Protocols/NSObject_Protocol/Reference/NSObject.html#//apple_ref/occ/intfm/NSObject/performSelector:withObject:
 *      [2]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Protocols/NSObject_Protocol/Reference/NSObject.html#//apple_ref/occ/intfm/NSObject/performSelector:withObject:withObject:
 */
- (id)performSelector:(SEL)aSelector withObject:(id)object1 withObject:(id)object2 withObject:(id)object3 withObject:(id)object4;

/*!
 *  @name Associative References
 */

/*!
 *  @brief Returns the value associated with a given object for a given key.
 *  @param object The source object for the association.
 *  @param key The key for the association.
 *  @return The value associated with the key key for object.
 *  @see [objc_getAssociatedObject][0]
 *      [0]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/objc_getAssociatedObject
 */
- (id)associatedObjectForKey:(void *)key;

/*!
 *  @brief Sets an associated value for a given object using a given key. Association policy is `retain`.
 *  @param object The source object for the association.
 *  @param key The key for the association.
 *  @param value The value to associate with the key key for object. Pass nil to clear an existing association.
 *  @see [objc_setAssociatedObject][0]
 *      [0]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/objc_setAssociatedObject
 */
- (void)setAssociatedObject:(id)object forKey:(void *)key;

/*!
 *  @brief Sets an associated value for a given object using a given key and association policy.
 *  @param object The source object for the association.
 *  @param key The key for the association.
 *  @param value The value to associate with the key key for object. Pass nil to clear an existing association.
 *  @param policy The policy for the association. For possible values, see [Associative Object Behaviors][1].
 *  @see [objc_setAssociatedObject][0]
 *      [0]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/objc_setAssociatedObject
 *      [1]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/doc/constant_group/Associative_Object_Behaviors
 */
- (void)setAssociatedObject:(id)object forKey:(void *)key policy:(objc_AssociationPolicy)policy;

/*!
 *  @brief Removes all associations for a given object. Association policy is `retain`.
 *  @param object The source object for the association.
 *  @details setAssociatedObject:nil forKey:key
 *  @see [objc_setAssociatedObject][0]
 *      [0]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/objc_setAssociatedObject
 */
- (void)removeAssociatedObjectForKey:(void *)key;

/*!
 *  @brief Removes all associations for a given object.
 *  @param object The source object for the association.
 *  @param policy The policy for the association. For possible values, see [Associative Object Behaviors][1].
 *  @details setAssociatedObject:nil forKey:key policy:policy
 *  @see [objc_setAssociatedObject][0]
 *      [0]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/objc_setAssociatedObject
 *      [1]: http://developer.apple.com/library/ios/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/doc/constant_group/Associative_Object_Behaviors
 */
- (void)removeAssociatedObjectForKey:(void *)key policy:(objc_AssociationPolicy)policy;


@end

/*!
 *  @brief Class extensions.
 */
@interface NSObject (ObjCRuntimeClass)

/*!
 *  @brief Returns name of class.
 *  @see [class_getName][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_getName
 */
+ (NSString *)name;

/*!
 *  @brief Returns name of class.
 *  @deprecated Renamed to name
 */
+ (NSString *)className __deprecated;

/*!
 *  @brief Returns Method from given selector;
 *  @see [class_getInstanceMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_getInstanceMethod
 */
+ (Method)methodValueForSelector:(SEL)selector;

/*!
 *  @brief Returns Method from given selector;
 *  @see [class_getInstanceMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_getInstanceMethod
 */
+ (NSAMethod *)methodObjectForSelector:(SEL)selector;

/*!
 *  @brief Returns class Method from given selector;
 *  @see [class_getClassMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_getClassMethod
 */
+ (Method)classMethodValueForSelector:(SEL)selector;

/*!
 *  @brief Returns class Method from given selector;
 *  @see [class_getClassMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_getClassMethod
 */
+ (NSAMethod *)classMethodObjectForSelector:(SEL)selector;

/*!
 *  @brief Returns IMP from given method
 *  @see [class_getMethodImplementation][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_getMethodImplementation
 */
+ (IMP)methodImplementationForSelector:(SEL)selector;

/*!
 *  @brief Adds a new method to a class with a given name and template method.
 *  @see [class_addMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_addMethod
 */
+ (void)addMethodForSelector:(SEL)selector fromMethod:(NSAMethod *)method;

/*!
 *  @brief Adds a new method to a class with a given name and implementation.
 *  @see [class_addMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_addMethod
 */
+ (void)addMethodForSelector:(SEL)selector implementation:(IMP)implementation types:(NSString *)implementationTypes;

/*!
 *  @brief Adds a new class method to a class with a given name and template method.
 *  @see [class_addMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_addMethod
 */
+ (void)addClassMethodForSelector:(SEL)selector fromMethod:(NSAMethod *)method;

/*!
 *  @brief Adds a new class method to a class with a given name and implementation.
 *  @see [class_addMethod][1]
 *      [1]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/class_addMethod
 */
+ (void)addClassMethodForSelector:(SEL)selector implementation:(IMP)implementation types:(NSString *)implementationTypes;

@end


/*!
 *  @brief Object wrapper for Method
 *  @see [Method][0]
 *      [0]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/tdef/Method
 */
@interface NSAMethod : NSObject {
    Method _method;
}

/*!
 *  @brief Wrapped value of type [Method][0]
 *      [0]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/tdef/Method
 */
@property(nonatomic, readonly) Method method;

/*!
 *  @brief Implementation of the method.
 *
 *  @see [method_getImplementation][0]
 *      [0]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/method_getImplementation
 */
@property(nonatomic, assign) IMP implementation;

/*!
 *  @brief Type encoding of the method.
 *
 *  @see [method_getTypeEncoding][0]
 *      [0]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/method_getTypeEncoding
 */
@property(nonatomic, readonly) NSString *typeEncoding;

/*!
 *  @brief Exchanges the implementation of tho methods.
 *
 *  @see [method_exchangeImplementations][0]
 *      [0]: https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html#//apple_ref/c/func/method_exchangeImplementations
 */
- (void)exchangeImplementationWith:(NSAMethod *)method;

@end
