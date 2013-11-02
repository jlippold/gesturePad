//
//  UIApplication.m
//  FoundationExtension
//
//  Created by Jeong YunWon on 10. 3. 27..
//  Copyright 2010 youknowone.org All rights reserved.
//

#import "UIApplication.h"
#import "NSObject.h"

@implementation UIApplication (PrivatePatch)

- (CGRect)__statusBarFrameForOrientation:(UIInterfaceOrientation)orientation {
    assert(NO);
    return CGRectZero;
}

@end

@implementation UIApplication (Shortcuts)

- (CGRect)statusBarFrameForCurrentOrientation {
    Class class = [UIApplication class];
    NSString *selectorName = [@"statusBarFrame" stringByAppendingString:@"ForOrientation:"];
    [class methodObjectForSelector:@selector(__statusBarFrameForOrientation:)].implementation = [class methodObjectForSelector:NSSelectorFromString(selectorName)].implementation;
    return [self __statusBarFrameForOrientation:self.statusBarOrientation];
}

- (CGSize) statusBarOrientationReducedSize {
    return [self statusBarSizeForOrientation:self.statusBarOrientation];
}

- (CGSize) statusBarSizeForOrientation:(UIInterfaceOrientation)orientation {
    if ( UIInterfaceOrientationIsPortrait(orientation) ) return self.statusBarFrame.size;
    return CGSizeMake(self.statusBarFrame.size.height, self.statusBarFrame.size.width);
}

@end
